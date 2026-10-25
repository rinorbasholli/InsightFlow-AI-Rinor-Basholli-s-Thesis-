#!/usr/bin/env python3
"""Local inference API. Express calls this instead of asking Gemini for fake confidences."""
from __future__ import annotations

import json
import os
from pathlib import Path

import torch
import torch.nn.functional as F
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from torchvision import datasets, transforms

from run_attacks import fgsm, load_cifar_resnet, logits, pgd, try_torchattacks

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


def resolve_class(name: str) -> int:
    key = (name or "").strip().lower()
    mapped = ALIAS.get(key, key)
    if mapped in CIFAR_CLASSES:
        return CIFAR_CLASSES.index(mapped)
    return 0


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
    m = model()
    y_idx = resolve_class(req.originalClass)
    found = None
    for i in range(len(DATASET)):
        x, y = DATASET[i]
        if int(y) == y_idx:
            found = x.unsqueeze(0)
            break
    if found is None:
        found = DATASET[0][0].unsqueeze(0)
        y_idx = int(DATASET[0][1])
    x = found.to(DEVICE)
    y = torch.tensor([y_idx], device=DEVICE)
    with torch.no_grad():
        clean_logits = logits(m, x)
        clean_prob = F.softmax(clean_logits, dim=1)[0]
        clean_pred = int(clean_prob.argmax())
        clean_conf = float(clean_prob[clean_pred] * 100)
    eps = float(req.noiseLevel)
    method = (req.method or "fgsm").lower()
    x_adv = try_torchattacks(m, x, y, eps, method)
    if x_adv is None:
        x_adv = fgsm(m, x, y, eps) if method == "fgsm" else pgd(m, x, y, eps)
    with torch.no_grad():
        adv_logits = logits(m, x_adv)
        adv_prob = F.softmax(adv_logits, dim=1)[0]
        adv_pred = int(adv_prob.argmax())
        adv_conf = float(adv_prob[adv_pred] * 100)
        linf = float((x_adv - x).abs().amax().item())
    return {
        "success": True,
        "source": "computed",
        "perturbation": {
            "originalClass": CIFAR_CLASSES[clean_pred],
            "originalConfidence": round(clean_conf, 2),
            "targetClass": CIFAR_CLASSES[adv_pred],
            "targetConfidence": round(adv_conf, 2),
            "noiseStrength": round(linf, 5),
            "mathematicalLogs": (
                f"Real {method.upper()} on {MODEL_ID}\n"
                f"x_adv = clip(x + eps * sign(grad_x J), 0, 1), eps={eps}\n"
                f"L_inf={linf:.5f}; clean={CIFAR_CLASSES[clean_pred]} {clean_conf:.1f}%; "
                f"adv={CIFAR_CLASSES[adv_pred]} {adv_conf:.1f}%"
            ),
            "robustDefenseSteps": [
                "Adversarial training with FGSM/PGD examples in the training loop.",
                "Input preprocessing (JPEG compression or spatial smoothing) before inference.",
                "Do not trust a single softmax score as a security control.",
            ],
            "requestedArchitecture": req.architecture,
            "dataset": "CIFAR-10",
        },
    }
