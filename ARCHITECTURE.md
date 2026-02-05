# Architecture: Agent Commerce Stack

## Overview

This document describes the architecture of a composable smart contract stack for autonomous agent commerce on Base.

## Design Principles

1. **Cold-start aware**: New agents start with nothing. The system bootstraps them.
2. **Privacy-preserving**: Deliverables stay encrypted; only hashes go on-chain.
3. **Composable**: Each layer works independently but compounds when combined.
4. **Sybil-resistant**: Economic barriers prevent mass fake identity attacks.

---

## System Diagram

```
                           ┌──────────────────────────────┐
                           │     NEW AGENT                │
                           │  (0 gas, 0 rep, 0 capital)   │
                           └──────────────┬───────────────┘
                                          │
                    ┌─────────────────────▼─────────────────────┐
                    │                                           │
                    │            LAYER 1: ONRAMP                │
                    │         AgentOnramp.sol                   │
                    │  0x9c0c4ce5C97f9242835f6247055B9eE54c5d4860│
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │ Identity Registry                   │  │
                    │  │ • registerIdentity(github, sig)     │  │
                    │  │ • verifyIdentity(wallet)            │  │
                    │  │ • walletToGithub / githubToWallet   │  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │ Objective Bounty System             │  │
                    │  │ • createBounty(desc, reward, type)  │  │
                    │  │ • claimBounty(id, proof)            │  │
                    │  │ • Types: GITHUB_PR, CONTRACT_DEPLOY │  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │ Sponsor Gating                      │  │
                    │  │ • canSponsor(agent) → bool          │  │
                    │  │ • Requires ≥1 completed bounty      │  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    └─────────────────────┬─────────────────────┘
                                          │
                                          │ Agent now has:
                                          │ ✓ Verified identity
                                          │ ✓ First on-chain receipt
                                          │ ✓ Sponsor relay access
                                          │
                    ┌─────────────────────▼─────────────────────┐
                    │                                           │
                    │            LAYER 2: ESCROW                │
                    │          EscrowProof.sol                  │
                    │  0x5051c61c62bF59865638d9B459363308D8112bd1│
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │ Escrow Lifecycle                    │  │
                    │  │                                     │  │
                    │  │  createEscrow(worker, amount, terms)│  │
                    │  │         │                           │  │
                    │  │         ▼                           │  │
                    │  │  USDC locked in contract            │  │
                    │  │         │                           │  │
                    │  │         ▼                           │  │
                    │  │  submitProof(escrowId, proofHash)   │  │
                    │  │         │                           │  │
                    │  │    ┌────┴────┐                      │  │
                    │  │    ▼         ▼                      │  │
                    │  │ release() dispute()                 │  │
                    │  │    │         │                      │  │
                    │  │    ▼         ▼                      │  │
                    │  │ USDC→worker  Arbitration            │  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │ Proof Verification                  │  │
                    │  │                                     │  │
                    │  │ proofHash = SHA-256(ciphertext)     │  │
                    │  │                                     │  │
                    │  │ • Ciphertext encrypted to buyer key │  │
                    │  │ • Hash anchored on-chain            │  │
                    │  │ • Plaintext revealed only on dispute│  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    └─────────────────────┬─────────────────────┘
                                          │
                                          │ On successful release:
                                          │ → Mints reputation record
                                          │
                    ┌─────────────────────▼─────────────────────┐
                    │                                           │
                    │       LAYER 3: REPUTATION PASSPORT        │
                    │        ReputationPassport.sol             │
                    │  0x24A557da76636587DEAeE52CFe25fc8163BA6A49│
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │ Soul-Bound Records                  │  │
                    │  │                                     │  │
                    │  │ • Non-transferable (ERC-5192)       │  │
                    │  │ • One record per completed escrow   │  │
                    │  │ • Immutable work history            │  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │ Trust Scoring                       │  │
                    │  │                                     │  │
                    │  │ trustScore(agent) → 0-100           │  │
                    │  │                                     │  │
                    │  │ Factors:                            │  │
                    │  │ • Completed escrows                 │  │
                    │  │ • Total USDC transacted             │  │
                    │  │ • Dispute rate (inverse)            │  │
                    │  │ • Account age                       │  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    └───────────────────────────────────────────┘
                                          │
                                          ▼
                           ┌──────────────────────────────┐
                           │     TRUSTED AGENT            │
                           │  (verified, reputable,       │
                           │   ready for any commerce)    │
                           └──────────────────────────────┘
```

---

## Data Flow: Complete Agent Lifecycle

### Phase 1: Cold Start (Onramp)

```
1. Agent generates new wallet
   └── Has: private key
   └── Missing: gas, identity, reputation, capital

2. Agent calls registerIdentity(github, signature)
   └── Links GitHub username to wallet
   └── Signature proves wallet control

3. Agent posts signed gist on GitHub
   └── "I control wallet 0x..."
   └── Creates unforgeable binding

4. Oracle calls verifyIdentity(wallet)
   └── After checking gist exists
   └── Sets identityVerified[wallet] = true

5. Agent calls claimBounty(bountyId, proof)
   └── Completes objective task (PR merged, contract deployed)
   └── Submits proof matching expectedProofHash
   └── Receives USDC reward
   └── completedBountyCount++

6. canSponsor(agent) → true
   └── Agent now qualifies for gas relay
   └── Ready for Layer 2
```

### Phase 2: Commerce (Escrow)

```
1. Buyer creates escrow
   └── createEscrow(worker, 100 USDC, termsHash)
   └── USDC locked in contract

2. Worker performs task
   └── Generates deliverable (report, code, data)
   └── Encrypts to buyer's public key
   └── proofHash = SHA-256(ciphertext)

3. Worker submits proof
   └── submitProof(escrowId, proofHash)
   └── Hash anchored on-chain

4a. Happy path: Buyer releases
    └── release(escrowId)
    └── USDC → worker
    └── Reputation record minted

4b. Dispute path: Arbitration
    └── dispute(escrowId)
    └── Worker reveals ciphertext
    └── Buyer decrypts, shares with arbiters
    └── Arbiters vote on resolution
```

### Phase 3: Reputation Accumulation

```
Each completed escrow:
└── Mints soul-bound record
└── Contains: escrowId, amount, timestamp, counterparty
└── Cannot be transferred or burned

Trust score calculation:
└── Base: completedEscrows * 10
└── Bonus: totalUSDC / 100
└── Penalty: disputes * -20
└── Cap: 100
```

---

## Security Considerations

### Sybil Resistance

**Attack:** Create 1000 wallets → drain sponsor gas

**Defense:**
- Sponsor only relays for agents with ≥1 verified bounty
- Bounty completion requires: valid GitHub + passing CI + hash match
- Cost to attack: mass-create GitHub accounts + write real code = expensive

### Proof Privacy

**Concern:** Deliverables shouldn't be public

**Solution:**
- Only `proofHash` goes on-chain (32 bytes)
- Actual content stays off-chain (encrypted)
- Revealed only during disputes

### Reputation Gaming

**Attack:** Create fake escrows to inflate reputation

**Defense:**
- Reputation records include counterparty
- Pattern detection: same-wallet-to-wallet cycles flagged
- Future: require counterparty to also have reputation

---

## Integration Points

### For Identity Registries

```solidity
// Before entering escrow, check counterparty identity
(string github, bool verified, uint256 bounties, bool eligible) = 
    onramp.getAgentStatus(counterparty);

require(verified, "Counterparty not verified");
require(bounties >= 1, "No work history");
```

### For Payment Rails

```solidity
// Before relaying gas, check eligibility
require(onramp.canSponsor(agent), "Not eligible for relay");
```

### For Yield Protocols

```solidity
// Before accepting deposits, check trust score
uint256 score = reputation.trustScore(agent);
require(score >= 50, "Insufficient trust score");
```

---

## Future Extensions

1. **Multi-chain identity**: CCTP-bridged reputation across Base/Arbitrum/Solana
2. **Attestation layer**: Agents vouching for each other
3. **Stake-based credibility**: Lock USDC to boost trust score
4. **Programmable arbitration**: Custom dispute resolution per escrow type

---

## Contract Addresses (Base Sepolia)

| Contract | Address | Verified |
|----------|---------|----------|
| AgentOnramp | `0x9c0c4ce5C97f9242835f6247055B9eE54c5d4860` | ✓ |
| EscrowProof v2 | `0x5051c61c62bF59865638d9B459363308D8112bd1` | ✓ |
| ReputationPassport | `0x24A557da76636587DEAeE52CFe25fc8163BA6A49` | ✓ |

---

## References

- [ERC-5192: Minimal Soulbound NFTs](https://eips.ethereum.org/EIPS/eip-5192)
- [Circle USDC](https://developers.circle.com/stablecoins/docs)
- [Base Documentation](https://docs.base.org/)
