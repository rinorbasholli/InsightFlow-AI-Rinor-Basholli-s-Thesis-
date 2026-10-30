#!/usr/bin/env python3
"""Pixel-space FGSM/PGD on CIFAR-10 ResNet-56, n>=200.

Cited numbers come from this file. ImageNet ResNet-50 is a different input
size and label space, so it is not loaded here.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms

OUT = Path(__file__).resolve().parent / "results"
OUT.mkdir(parents=True, exist_ok=True)

CIFAR10_MEAN = (0.4914, 0.4822, 0.4465)
CIFAR10_STD = (0.2470, 0.2435, 0.2616)


def normalize(x):
    mean = x.new_tensor(CIFAR10_MEAN).view(1, 3, 1, 1)
    std = x.new_tensor(CIFAR10_STD).view(1, 3, 1, 1)
    return (x - mean) / std


def logits(model, x):
    return model(normalize(x))


def project_linf(x_adv, x0, eps):
    return torch.max(torch.min(x_adv, x0 + eps), x0 - eps).clamp(0.0, 1.0)


def run_local_attack(model, x, y, eps, method="fgsm", target=None, steps=10):
    """Pixel-space FGSM/PGD. target=None is untargeted (away from y)."""
    label = target if target is not None else y
    sign = -1.0 if target is not None else 1.0
    alpha = eps if method == "fgsm" else (eps / 4 if eps > 0 else 0.0)
    n = 1 if method == "fgsm" else steps
    x0 = x.detach()
    x_adv = x0.clone()
    for _ in range(n):
        x_adv = x_adv.detach().requires_grad_(True)
        F.cross_entropy(logits(model, x_adv), label).backward()
        x_adv = x_adv.detach() + sign * alpha * x_adv.grad.sign()
        x_adv = project_linf(x_adv, x0, eps)
    return x_adv.detach()


def load_cifar_resnet(device):
    model = torch.hub.load(
        "chenyaofo/pytorch-cifar-models",
        "cifar10_resnet56",
        pretrained=True,
        trust_repo=True,
    )
    model.eval().to(device)
    return model, "cifar10_resnet56"


def wilson(k, n, z=1.96):
    if n <= 0:
        return [0.0, 1.0]
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5) / d
    return [max(0.0, c - h), min(1.0, c + h)]


def git_short():
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=str(Path(__file__).resolve().parents[2]),
            text=True,
        ).strip()
    except Exception:
        return "unknown"


def accuracy(model, loader, device, attack=None, eps=0.0):
    correct = 0
    total = 0
    flips = 0
    clean_correct = 0
    success_cc = 0
    linf = []
    rows = []
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        with torch.no_grad():
            clean_pred = logits(model, x).argmax(1)
        if attack is None:
            pred = clean_pred
        else:
            x_use = run_local_attack(model, x, y, eps, method=attack, target=None)
            x_use = project_linf(x_use, x, eps)
            with torch.no_grad():
                pred = logits(model, x_use).argmax(1)
            linf.extend((x_use - x).abs().amax(dim=(1, 2, 3)).cpu().tolist())
            cc = clean_pred == y
            clean_correct += int(cc.sum().item())
            success_cc += int(((pred != y) & cc).sum().item())
            flips += int((pred != clean_pred).sum().item())
        correct += int((pred == y).sum().item())
        total += int(y.numel())
        for i in range(y.numel()):
            rows.append(
                {
                    "y": int(y[i]),
                    "clean_pred": int(clean_pred[i]),
                    "pred": int(pred[i]),
                }
            )
    n = total
    return {
        "n": n,
        "accuracy": correct / n if n else 0.0,
        "n_clean_correct": clean_correct if attack else n,
        "asr": success_cc / clean_correct if attack and clean_correct else 0.0,
        "flip_rate": flips / n if attack and n else 0.0,
        "mean_linf": float(np.mean(linf)) if linf else 0.0,
        "max_linf": float(np.max(linf)) if linf else 0.0,
        "rows": rows,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--n", type=int, default=200)
    p.add_argument("--seed", type=int, default=20260927)
    args = p.parse_args()

    device = torch.device("cpu")
    tfm = transforms.ToTensor()
    test = datasets.CIFAR10(root=str(OUT / "cifar10"), train=False, download=False, transform=tfm)
    rng = np.random.RandomState(args.seed)
    idx = rng.choice(len(test), size=min(args.n, len(test)), replace=False)
    loader = DataLoader(Subset(test, idx.tolist()), batch_size=4, shuffle=False)

    print("loading cifar10_resnet56...", flush=True)
    model, model_id = load_cifar_resnet(device)
    print(f"model={model_id} n={len(idx)} device={device}", flush=True)
    buckets = [2 / 255, 8 / 255, 16 / 255]
    summary = {
        "model": model_id,
        "dataset": "CIFAR-10 test subset",
        "n": int(min(args.n, len(test))),
        "seed": args.seed,
        "source": "computed",
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "torch_version": torch.__version__,
        "git_commit": git_short(),
        "asr_definition": "label flip among images the model classified correctly before the attack",
        "buckets": [],
    }
    print("measuring clean accuracy...", flush=True)
    clean = accuracy(model, loader, device)
    summary["clean_accuracy"] = clean["accuracy"]
    print(f"clean_accuracy={clean['accuracy']}", flush=True)
    for eps in buckets:
        print(f"FGSM eps={eps}...", flush=True)
        fgsm_m = accuracy(model, loader, device, attack="fgsm", eps=eps)
        print(f"PGD eps={eps}...", flush=True)
        pgd_m = accuracy(model, loader, device, attack="pgd", eps=eps)
        n = fgsm_m["n"]
        assert fgsm_m["max_linf"] <= eps + 1e-6, f"FGSM L_inf {fgsm_m['max_linf']} exceeds {eps}"
        assert pgd_m["max_linf"] <= eps + 1e-6, f"PGD L_inf {pgd_m['max_linf']} exceeds {eps}"
        summary["buckets"].append(
            {
                "epsilon": eps,
                "fgsm_robust_accuracy": fgsm_m["accuracy"],
                "fgsm_robust_accuracy_ci95": wilson(round(fgsm_m["accuracy"] * n), n),
                "fgsm_asr": fgsm_m["asr"],
                "fgsm_flip_rate": fgsm_m["flip_rate"],
                "fgsm_n_clean_correct": fgsm_m["n_clean_correct"],
                "fgsm_mean_linf": fgsm_m["mean_linf"],
                "fgsm_max_linf": fgsm_m["max_linf"],
                "pgd_robust_accuracy": pgd_m["accuracy"],
                "pgd_robust_accuracy_ci95": wilson(round(pgd_m["accuracy"] * n), n),
                "pgd_asr": pgd_m["asr"],
                "pgd_flip_rate": pgd_m["flip_rate"],
                "pgd_n_clean_correct": pgd_m["n_clean_correct"],
                "pgd_mean_linf": pgd_m["mean_linf"],
                "pgd_max_linf": pgd_m["max_linf"],
            }
        )
        path = OUT / "adversarial_metrics.json"
        path.write_text(json.dumps(summary, indent=2))
        print("checkpoint", path, flush=True)
    path = OUT / "adversarial_metrics.json"
    path.write_text(json.dumps(summary, indent=2))
    print(json.dumps({k: v for k, v in summary.items() if k != "buckets"}, indent=2))
    print(json.dumps(summary["buckets"], indent=2))
    print("wrote", path)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback

        traceback.print_exc()
        raise
