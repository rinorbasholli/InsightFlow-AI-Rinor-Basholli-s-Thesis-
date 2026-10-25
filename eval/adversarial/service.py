#!/usr/bin/env python3
"""Local inference API. Same pixel-space FGSM/PGD as run_attacks.py."""
from __future__ import annotations

import json
import os
from pathlib import Path

import torch
import torch.nn.functional as F
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from torchvision import datasets, transforms

from run_attacks import load_cifar_resnet, logits, run_local_attack

CIFAR_CLASSES = [
    "airplane",
    "automobile",
    "bird",
    "cat",
    "deer",
    "dog",
    "frog",
    "horse",
    "ship",
    "truck",
]
ALIAS = {
    "airplane": "airplane",
    "plane": "airplane",
    "bird": "bird",
    "car": "automobile",
    "sports car": "automobile",
    "automobile": "automobile",
    "truck": "truck",
    "ship": "ship",
    "dog": "dog",
    "cat": "cat",
}

app = FastAPI(title="InsightFlow adversarial eval")
DEVICE = torch.device("cpu")
MODEL = None
MODEL_ID = ""
DATASET = None


def model():
    global MODEL, MODEL_ID, DATASET
    if MODEL is None:
        MODEL, MODEL_ID = load_cifar_resnet(DEVICE)
        DATASET = datasets.CIFAR10(
            root=str(Path(__file__).parent / "results" / "cifar10"),
            train=False,
            download=True,
            transform=transforms.ToTensor(),
        )
    return MODEL


class AttackReq(BaseModel):
    originalClass: str = "airplane"
    targetClass: str = "bird"
    noiseLevel: float = 0.05
    architecture: str = "ResNet-56"
    method: str = "fgsm"
    targeted: bool = False


def resolve_class(name: str) -> int:
    key = (name or "").strip().lower()
    mapped = ALIAS.get(key, key)
    if mapped not in CIFAR_CLASSES:
        raise HTTPException(status_code=400, detail=f"unknown class '{name}'")
    return CIFAR_CLASSES.index(mapped)


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_ID or "cifar10_resnet56"}


@app.get("/summary")
def summary():
    path = Path(__file__).parent / "results" / "adversarial_metrics.json"
    if not path.exists():
        return {"success": False, "error": "Run eval/adversarial/run_attacks.py first."}
    return {"success": True, "source": "computed", **json.loads(path.read_text())}


EVAL_TOKEN = os.environ.get("EVAL_INTERNAL_TOKEN", "").strip()


def require_eval_token(x_eval_token: str | None = Header(default=None, alias="X-Eval-Token")):
    if not EVAL_TOKEN:
        return
    if x_eval_token != EVAL_TOKEN:
        raise HTTPException(status_code=401, detail="eval token required")


def run():
    import uvicorn

    port = int(os.environ.get("PORT", "8001"))
    uvicorn.run("service:app", host="0.0.0.0", port=port, reload=False)


if __name__ == "__main__":
    run()


@app.post("/attack")
def attack(req: AttackReq, x_eval_token: str | None = Header(default=None, alias="X-Eval-Token")):
    require_eval_token(x_eval_token)
    eps = float(req.noiseLevel)
    if not 0 < eps <= 0.25:
        raise HTTPException(status_code=400, detail="noiseLevel must be in (0, 0.25]")
    m = model()
    y_idx = resolve_class(req.originalClass)
    found = None
    image_index = 0
    for i in range(len(DATASET)):
        x_i, y_i = DATASET[i]
        if int(y_i) != y_idx:
            continue
        cand = x_i.unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            if int(logits(m, cand).argmax(1).item()) == y_idx:
                found = cand
                image_index = i
                break
    if found is None:
        raise HTTPException(status_code=400, detail=f"no clean-correct CIFAR-10 image for class {req.originalClass}")
    x = found
    y = torch.tensor([y_idx], device=DEVICE)
    method = "pgd" if (req.method or "").lower() == "pgd" else "fgsm"
    t = torch.tensor([resolve_class(req.targetClass)], device=DEVICE) if req.targeted else None
    with torch.no_grad():
        clean_logits = logits(m, x)
        clean_prob = F.softmax(clean_logits, dim=1)[0]
        clean_pred = int(clean_prob.argmax())
        clean_conf = float(clean_prob[clean_pred] * 100)
    x_adv = run_local_attack(m, x, y, eps, method, t)
    with torch.no_grad():
        adv_logits = logits(m, x_adv)
        adv_prob = F.softmax(adv_logits, dim=1)[0]
        adv_pred = int(adv_prob.argmax())
        adv_conf = float(adv_prob[adv_pred] * 100)
        linf = float((x_adv - x).abs().amax().item())
    assert linf <= eps + 1e-6, f"L_inf {linf} exceeds eps {eps}"
    t_idx = int(t.item()) if t is not None else None
    target_reached = (adv_pred == t_idx) if t_idx is not None else None
    return {
        "success": True,
        "source": "computed",
        "perturbation": {
            "originalClass": CIFAR_CLASSES[clean_pred],
            "originalConfidence": round(clean_conf, 2),
            "targetClass": CIFAR_CLASSES[adv_pred],
            "targetConfidence": round(adv_conf, 2),
            "targetReached": target_reached,
            "noiseStrength": round(linf, 5),
            "epsilon": eps,
            "method": method,
            "targeted": bool(req.targeted),
            "cifarIndex": image_index,
            "modelId": MODEL_ID or "cifar10_resnet56",
            "mathematicalLogs": (
                f"{'Targeted' if req.targeted else 'Untargeted'} {method.upper()} on "
                f"{MODEL_ID or 'cifar10_resnet56'}\n"
                f"eps={eps}, L_inf={linf:.5f}, cifar_index={image_index}; "
                f"clean={CIFAR_CLASSES[clean_pred]} {clean_conf:.1f}%; "
                f"adv={CIFAR_CLASSES[adv_pred]} {adv_conf:.1f}%; "
                f"targetReached={target_reached}"
            ),
            "robustDefenseSteps": [
                "Adversarial training with FGSM/PGD examples in the training loop.",
                "Input preprocessing (JPEG compression or spatial smoothing) before inference.",
                "Do not trust a single softmax score as a security control.",
            ],
            "requestedArchitecture": req.architecture,
            "loadedArchitecture": MODEL_ID or "cifar10_resnet56",
            "dataset": "CIFAR-10",
        },
    }
