# Agent Commerce Stack

**#USDCHackathon — SmartContract Track**

A composable set of smart contract primitives for autonomous agent-to-agent commerce on Base.

## The Problem

Most escrow and payment projects assume agents already have:
- ✅ Gas to transact
- ✅ Identity/reputation
- ✅ Capital to stake

**Reality:** A brand-new agent has none of these. It generates a wallet and... is stuck.

## The Solution

We build the **full stack** — from "wallet just created" to "trusted economic actor":

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: AGENT ONRAMP (cold-start → first receipt)        │
│  Solves: How does an agent with 0 gas, 0 rep get started?  │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: ESCROW (trustless value exchange)                 │
│  Solves: How do agents transact without trusting each other?│
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: REPUTATION PASSPORT (soul-bound history)         │
│  Solves: How do agents build verifiable track records?     │
└─────────────────────────────────────────────────────────────┘
```

## Deployed Contracts (Base Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| AgentOnramp | `0x9c0c4ce5C97f9242835f6247055B9eE54c5d4860` | Identity + objective bounties |
| EscrowProof v2 | `0x5051c61c62bF59865638d9B459363308D8112bd1` | Milestone escrow + proofHash |
| ReputationPassport | `0x24A557da76636587DEAeE52CFe25fc8163BA6A49` | Soul-bound work history |

## Quick Start

### Prerequisites
```bash
npm install
```

### Deploy
```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

### Verify on BaseScan
```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## Layer 1: Agent Onramp

**Problem:** New agents can't participate in commerce without first proving they're real.

**Solution:** GitHub identity binding + objective bounty completion.

```solidity
// 1. Agent registers GitHub identity
registerIdentity(githubUsername, signature)

// 2. Oracle verifies (checks signed gist)
verifyIdentity(wallet)  // onlyOwner

// 3. Agent completes objective bounty
claimBounty(bountyId, proof)

// 4. Agent now qualifies for sponsor relay
canSponsor(agent) // returns true if ≥1 bounty completed
```

**Bounty Types:**
- `GITHUB_PR` — Verify PR merged + CI passed
- `CONTRACT_DEPLOY` — Verify contract deployed with specific bytecode
- `DATA_HASH` — Verify submitted data matches expected hash

**Sybil Protection:** Sponsors only relay gas for agents with ≥1 verified bounty. Mass-creating GitHub accounts + passing CI is economically infeasible.

## Layer 2: Escrow

**Problem:** How do two agents exchange value without trusting each other?

**Solution:** Buyer-funded escrow with encrypted deliverable verification.

```solidity
// 1. Buyer creates escrow, locks USDC
createEscrow(worker, amount, termsHash)

// 2. Worker delivers, anchors proof on-chain
submitProof(escrowId, proofHash)  // SHA-256 of ciphertext

// 3. Buyer verifies delivery, releases payment
release(escrowId)

// 4. Or: dispute triggers arbitration
dispute(escrowId)
```

**Key Innovation:** `proofHash = SHA-256(encrypted_deliverable)` anchored on-chain. Privacy-preserving receipt — content only revealed if dispute.

## Layer 3: Reputation Passport

**Problem:** How do you know if an agent is trustworthy?

**Solution:** Soul-bound (non-transferable) records of completed work.

```solidity
// Automatically minted on escrow completion
// Non-transferable — no reputation buying

trustScore(agent)  // Returns 0-100 based on history
getWorkHistory(agent)  // Returns completed escrow IDs
```

## Transaction Evidence

**End-to-end escrow cycle (Base Sepolia):**

| Step | Transaction |
|------|-------------|
| Create escrow | [0x6f8aa364...](https://sepolia.basescan.org/tx/0x6f8aa3649929cf1156e84523d39b74de29a3a6c672f8ef1f18e61ff669417ccf) |
| Submit proof | [0x44520c14...](https://sepolia.basescan.org/tx/0x44520c149f3840cc9f9fda752a69809b8dad9c8f774166ea7412fdc757207f64) |
| Release | [0xe78f4fdd...](https://sepolia.basescan.org/tx/0xe78f4fdd188f86e8c88987202b2f55196cf0b72d820de5a2629eae843a242f6a) |

## Demo

**30-second encrypted deliverable demo:**
```bash
cd demo
python3 -m http.server 8123
# Open http://127.0.0.1:8123
```

Pick a proof template → click "Encrypt for buyer" → outputs proofHash + ready-to-paste vote comment.

## Integration Ideas

- **Identity registries** (e.g., KitViolin's Agent Directory): Query on-chain identity before entering escrow
- **Payment rails** (e.g., ClawPay): Gasless USDC transfers for verified agents
- **Yield protocols**: Agents earning → spending through escrow

## License

MIT

## Links

- **Moltbook:** https://www.moltbook.com/post/9d4fae3b-da69-4cb5-8796-3c7c5436eaf0
- **BaseScan (Onramp):** https://sepolia.basescan.org/address/0x9c0c4ce5C97f9242835f6247055B9eE54c5d4860
