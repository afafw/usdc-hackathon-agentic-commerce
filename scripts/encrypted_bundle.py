#!/usr/bin/env python3
"""Encrypted deliverable demo (dependency-free).

This is a hackathon demo to make the primitive concrete:
- Create a plaintext "deliverable bundle" (JSON)
- Encrypt it for the buyer (XOR demo cipher; NOT secure)
- Anchor proofHash = sha256(ciphertext) (what you'd put on-chain)
- Decrypt and verify sha256(plaintext) matches

Why XOR? So anyone can run it with standard library only.
Replace with AES-256-GCM in production.

Usage:
  python3 scripts/encrypted_bundle.py

Output:
  demo/encrypted-bundle.sample.json
"""

import base64, json, hashlib, os, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEMO_DIR = ROOT / "demo"
DEMO_DIR.mkdir(exist_ok=True)


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def xor_crypt(data: bytes, key: bytes) -> bytes:
    out = bytearray(len(data))
    for i, x in enumerate(data):
        out[i] = x ^ key[i % len(key)]
    return bytes(out)


def main():
    plaintext_obj = {
        "kind": "deliverable_bundle",
        "ts": int(time.time()),
        "job": {
            "id": "job-123",
            "milestone": 0,
            "summary": "Example: write a concise technical report + patch suggestions",
        },
        "deliverables": {
            "files": [
                {"path": "report.md", "sha256": "<computed-offchain>"},
                {"path": "patch.diff", "sha256": "<computed-offchain>"},
            ],
            "notes": "Demo bundle (no real content).",
        },
    }

    plaintext = json.dumps(plaintext_obj, sort_keys=True, indent=2).encode("utf-8")
    key = os.urandom(32)
    ciphertext = xor_crypt(plaintext, key)

    proof_hash_ciphertext = sha256(ciphertext)
    plaintext_hash = sha256(plaintext)

    # buyer decrypts
    decrypted = xor_crypt(ciphertext, key)
    ok = decrypted == plaintext

    out = {
        "plaintext_sha256": plaintext_hash,
        "ciphertext_sha256": proof_hash_ciphertext,
        "ciphertext_b64": base64.b64encode(ciphertext).decode("ascii"),
        "demo_cipher": "XOR (NOT SECURE)",
        "buyer_key_b64": base64.b64encode(key).decode("ascii"),
        "decrypt_ok": ok,
        "note": "On-chain proofHash should be sha256(ciphertext). Buyer verifies by decrypting and recomputing sha256(plaintext).",
    }

    out_path = DEMO_DIR / "encrypted-bundle.sample.json"
    out_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")

    print("Wrote:", out_path)
    print("plaintext_sha256:", plaintext_hash)
    print("ciphertext_sha256 (proofHash):", proof_hash_ciphertext)
    print("decrypt_ok:", ok)


if __name__ == "__main__":
    main()
