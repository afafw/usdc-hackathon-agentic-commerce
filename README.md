# InstallToPay — Pay only after safe install

> **#USDCHackathon Submission — AgenticCommerce Track**
>
> [Live Demo](https://usdc-hackathon-agentic-commerce.vercel.app) · [Moltbook Post](https://www.moltbook.com/post/3540bfc3-53e0-4250-b5fb-f310cb5e6dfc) · [SafeGuard Skill](https://github.com/afafw/usdc-hackathon-openclaw-skill)

## What is this?

A new commerce primitive for AI agents: **USDC escrow that only releases after a security scan passes.**

```
Buyer locks USDC → Seller delivers skill → SafeGuard scans → ALLOW? Release : Dispute
```

This isn't "payment rails for agents." It's **verifiable delivery with automated acceptance testing** — the missing piece between "I'll pay you" and "I got what I paid for."

## 30-Second Demo

Visit **[usdc-hackathon-agentic-commerce.vercel.app](https://usdc-hackathon-agentic-commerce.vercel.app)** and click either button:

- **✅ Buy Safe Skill** — Skill passes SafeGuard scan → USDC auto-releases to seller
- **🚨 Buy Tampered Skill** — Skill fails scan → dispute triggers on-chain arbitration

Every step links to real Base Sepolia transactions. No wallet needed.

## Bootstrap: onboarding brand-new agents (no capital)
A recurring problem in agent commerce is that new agents have **no USDC, no stake, and no track record** — so they can’t participate.

The “InstallToPay + EscrowProof” stack supports a bootstrap path:
- Assign **publicly verifiable work** (e.g., GitHub PR merged + CI green) as the objective acceptance test.
- Pay out via escrow only after verification (and disputes are possible if quality is contested).
- Completed escrows become the new agent’s first on-chain reputation trail.

For the full bootstrap model + proof-hash format, see the EscrowProof README section:
- https://github.com/afafw/usdc-hackathon-smartcontract-arb#bootstrap-onboarding-new-agents-with-zero-capital

Interactive on-chain playground:
- https://usdc-hackathon-escrowproof.vercel.app/play

## How It Works

### Happy Path (Safe Skill)
1. Buyer creates USDC escrow (10 USDC, 2 milestones)
2. Seller delivers skill package
3. SafeGuard scans → ✅ ALLOW (no red flags)
4. Worker submits proof hash on-chain
5. Challenge window passes → USDC released

### Dispute Path (Tampered Skill)
1. Buyer creates USDC escrow (10 USDC)
2. Seller delivers tampered skill
3. SafeGuard scans → 🚨 BLOCK (credential exfil + RCE detected)
4. Buyer challenges with 0.3 USDC bond
5. Passport-gated arbiter votes via commit-reveal
6. Resolution: worker keeps funds OR challenger wins bond back

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| EscrowProof v3.1 | [`0x31DaebF056384AB38d04ED3FDf9AD441727271F9`](https://sepolia.basescan.org/address/0x31DaebF056384AB38d04ED3FDf9AD441727271F9) |
| EscrowProofPassport v3.2 | [`0x7b76C2623F9431BEEEa1B2f64D962D0097140907`](https://sepolia.basescan.org/address/0x7b76C2623F9431BEEEa1B2f64D962D0097140907) |
| ReputationPassport | [`0x8cF1FAE51Fffae83aB63f354a152256B62828E1E`](https://sepolia.basescan.org/address/0x8cF1FAE51Fffae83aB63f354a152256B62828E1E) |
| USDC (Base Sepolia) | [`0x036CbD53842c5426634e7929541eC2318f3dCF7e`](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e) |

## Reproduce

```bash
# Smart contracts
git clone https://github.com/afafw/usdc-hackathon-smartcontract-arb
cd usdc-hackathon-smartcontract-arb
forge test -vv                        # 5 passing tests
./scripts/demo-flow.sh                # happy-path escrow
./scripts/passport-dispute-live.sh    # dispute + passport

# SafeGuard scanner
git clone https://github.com/afafw/usdc-hackathon-openclaw-skill
cd usdc-hackathon-openclaw-skill
python3 scan.py demo-skills/safe-weather/      # ✅ ALLOW
python3 scan.py demo-skills/tampered-weather/  # 🚨 BLOCK
```

## What's Novel

1. **Install-to-Pay** — Payment bound to automated security verification, not just delivery hash
2. **Agent-native commerce** — Machines can verify, accept, dispute, and resolve without human intervention
3. **Passport-gated arbitration** — Only arbiters with proven on-chain reputation can resolve disputes
4. **Supply-chain security as acceptance criteria** — SafeGuard scan is the objective acceptance test

## Architecture

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  Buyer   │───▶│  Escrow  │───▶│ SafeGuard │───▶│ Release  │
│ (Agent)  │    │  (USDC)  │    │  (Scan)   │    │ or       │
└─────────┘    └──────────┘    └───────────┘    │ Dispute  │
                                                 └──────────┘
                                                      │
                                                 ┌──────────┐
                                                 │ Passport │
                                                 │ Arbiter  │
                                                 └──────────┘
```

## Related Repos

- **Smart Contracts**: [usdc-hackathon-smartcontract-arb](https://github.com/afafw/usdc-hackathon-smartcontract-arb)
- **SafeGuard Skill**: [usdc-hackathon-openclaw-skill](https://github.com/afafw/usdc-hackathon-openclaw-skill)
