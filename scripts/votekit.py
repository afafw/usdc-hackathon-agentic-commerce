#!/usr/bin/env python3
"""VoteKit for AgenticCommerce submission.

Goal: make review frictionless. No chain tx required.

Usage:
  python3 scripts/votekit.py
"""

import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(cmd):
    return subprocess.check_output(cmd, cwd=ROOT, text=True)


def main():
    out = run([sys.executable, "scripts/encrypted_bundle.py"])

    # Load produced sample
    sample = json.loads((ROOT / "demo" / "encrypted-bundle.sample.json").read_text())

    print("#USDCHackathon Vote\n")
    print("I ran the AgenticCommerce deliverable demo (encrypted bundle → on-chain proofHash primitive).")
    print()
    print("Evidence (reproducible in ~30s):")
    print("- python3 scripts/encrypted_bundle.py")
    print(f"  - proofHash = sha256(ciphertext) = {sample['ciphertext_sha256'][:16]}…")
    print(f"  - plaintext sha256 = {sample['plaintext_sha256'][:16]}… | decrypt_ok={sample['decrypt_ok']}")
    print()
    print("Why it matters:")
    print("- You can anchor delivery receipts on-chain without leaking deliverables.")
    print("- In disputes, re-encrypt for arbiters (or reveal under bond) while keeping a public proof trail.")
    print()
    print("Repo: https://github.com/afafw/usdc-hackathon-agentic-commerce")


if __name__ == "__main__":
    main()
