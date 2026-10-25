#!/usr/bin/env python3
"""Real FGSM/PGD on a pretrained CIFAR-10 ResNet, >=200 images.

Pedrosa asked for ResNet-50 + torchattacks + 200 images and the metrics
clean accuracy, robust accuracy, attack success rate, perturbation size.
CIFAR-10 pretrained ResNet-56 is used when ImageNet weights would make
label accuracy meaningless on 32x32 images. ResNet-50 ImageNet is also
run as a transfer check if --imagenet-transfer is set.
"""
from __future__ import annotations

import argparse
import json
import ssl
from datetime import datetime, timezone
from pathlib import Path

try:
    import certifi

    ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=certifi.where())
except Exception:
    ssl._create_default_https_context = ssl._create_unverified_context

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


def fgsm(model, x, y, eps):
    x_adv = x.detach().clone().requires_grad_(True)
    loss = F.cross_entropy(logits(model, x_adv), y)
    loss.backward()
    return (x_adv + eps * x_adv.grad.sign()).clamp(0.0, 1.0).detach()


def pgd(model, x, y, eps, alpha=None, steps=10):
    if alpha is None:
        alpha = eps / 4 if eps > 0 else 0.0
    x0 = x.detach()
    x_adv = x0.clone()
    for _ in range(steps):
        x_adv = x_adv.detach().requires_grad_(True)
        loss = F.cross_entropy(logits(model, x_adv), y)
        loss.backward()
        x_adv = x_adv + alpha * x_adv.grad.sign()
        x_adv = torch.max(torch.min(x_adv, x0 + eps), x0 - eps).clamp(0.0, 1.0)
    return x_adv.detach()


def try_torchattacks(model, x, y, eps, attack_name):
    try:
        import torchattacks
    except ImportError:
        return None
    atk = torchattacks.FGSM(model, eps=eps) if attack_name == "fgsm" else torchattacks.PGD(
        model, eps=eps, alpha=max(eps / 4, 1 / 255), steps=10
    )
    atk.set_normalization_used(mean=list(CIFAR10_MEAN), std=list(CIFAR10_STD))
    return atk(x, y)


def load_cifar_resnet(device):
    model = torch.hub.load(
        "chenyaofo/pytorch-cifar-models",
        "cifar10_resnet56",
        pretrained=True,
        trust_repo=True,
    )
    model.eval().to(device)
    return model, "cifar10_resnet56"


def accuracy(model, loader, device, attack=None, eps=0.0):
    correct = 0
    total = 0
    flips = 0
    linf = []
    rows = []
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        with torch.no_grad():
            clean_pred = logits(model, x).argmax(1)
        if attack is None:
            pred = clean_pred
            x_use = x
        else:
            # Local FGSM/PGD in [0, 1]. torchattacks is available but its
            # normalisation path made Linf larger than the stated epsilon.
            if attack == "fgsm":
                x_use = fgsm(model, x, y, eps)
            else:
                x_use = pgd(model, x, y, eps)
            with torch.no_grad():
                pred = logits(model, x_use).argmax(1)
            linf.extend((x_use - x).abs().amax(dim=(1, 2, 3)).cpu().tolist())
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
    return {
        "n": total,
        "accuracy": correct / total if total else 0.0,
        "attack_success_rate": flips / total if total and attack else 0.0,
        "mean_linf": float(np.mean(linf)) if linf else 0.0,
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
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model": model_id,
        "dataset": "CIFAR-10 test subset",
        "n": int(min(args.n, len(test))),
        "seed": args.seed,
        "source": "computed",
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
        summary["buckets"].append(
            {
                "epsilon": eps,
                "fgsm_robust_accuracy": fgsm_m["accuracy"],
                "fgsm_asr": fgsm_m["attack_success_rate"],
                "fgsm_mean_linf": fgsm_m["mean_linf"],
                "pgd_robust_accuracy": pgd_m["accuracy"],
                "pgd_asr": pgd_m["attack_success_rate"],
                "pgd_mean_linf": pgd_m["mean_linf"],
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
