"use client";

import { useState } from "react";
import {
  SAFE_DEMO,
  TAMPERED_DEMO,
  SAFE_SCAN,
  TAMPERED_SCAN,
  BASESCAN,
  CONTRACTS,
  type Demo,
} from "@/lib/demos";

function TxLink({ tx }: { tx: string }) {
  if (!tx) return <span className="text-gray-500 text-xs">off-chain</span>;
  return (
    <a
      href={`${BASESCAN}/tx/${tx}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 text-xs font-mono break-all"
    >
      {tx.slice(0, 10)}...{tx.slice(-8)}
    </a>
  );
}

function ScanReport({
  scan,
}: {
  scan: typeof SAFE_SCAN | typeof TAMPERED_SCAN;
}) {
  const blocked = scan.verdict === "BLOCK";
  return (
    <div
      className={`rounded-lg border p-4 my-4 ${
        blocked
          ? "border-red-500/50 bg-red-950/30"
          : "border-green-500/50 bg-green-950/30"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-lg font-bold ${
            blocked ? "text-red-400" : "text-green-400"
          }`}
        >
          {blocked ? "🚨 BLOCK" : "✅ ALLOW"}
        </span>
        <span className="text-gray-400 text-sm">
          {scan.skillName} v{scan.version}
        </span>
        <span className="text-gray-600 text-xs font-mono">{scan.hash}</span>
      </div>
      {scan.flags.length > 0 && (
        <ul className="space-y-1 mb-2">
          {scan.flags.map((f, i) => (
            <li key={i} className="text-red-300 text-sm font-mono">
              {f}
            </li>
          ))}
        </ul>
      )}
      <p className="text-gray-300 text-sm">{scan.summary}</p>
    </div>
  );
}

function Timeline({ demo }: { demo: Demo }) {
  return (
    <div className="space-y-4">
      {demo.steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step.status === "success"
                  ? "bg-green-600"
                  : step.status === "blocked"
                  ? "bg-red-600"
                  : "bg-yellow-600"
              }`}
            >
              {i + 1}
            </div>
            {i < demo.steps.length - 1 && (
              <div className="w-0.5 h-full bg-gray-700 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <h4 className="font-semibold text-white">{step.label}</h4>
            <p className="text-gray-400 text-sm">{step.desc}</p>
            <TxLink tx={step.tx} />
          </div>
        </div>
      ))}

      {/* Outcome */}
      <div
        className={`rounded-lg p-4 border ${
          demo.outcome === "released"
            ? "border-green-500/50 bg-green-950/30"
            : "border-yellow-500/50 bg-yellow-950/30"
        }`}
      >
        <p className="font-bold text-lg">
          {demo.outcomeEmoji} {demo.outcomeLabel}
        </p>
        <div className="mt-2 space-y-1">
          {demo.balances.map((b, i) => (
            <div key={i} className="text-sm text-gray-300 flex gap-4">
              <span className="w-32">{b.role}</span>
              <span className="text-gray-500">{b.before}</span>
              <span>→</span>
              <span className="font-bold text-white">{b.after}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState<"safe" | "tampered" | null>(null);

  const demo = active === "safe" ? SAFE_DEMO : active === "tampered" ? TAMPERED_DEMO : null;
  const scan = active === "safe" ? SAFE_SCAN : active === "tampered" ? TAMPERED_SCAN : null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">
          Install<span className="text-blue-400">To</span>Pay
        </h1>
        <p className="text-xl text-gray-400 mb-2">
          Pay only after safe install.
        </p>
        <p className="text-gray-500 max-w-xl mx-auto">
          Agent delivers a skill → SafeGuard scans it → USDC escrow releases
          only if safe. If tampered, dispute triggers on-chain arbitration with
          passport-gated arbiters.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 justify-center mb-8">
        <button
          onClick={() => setActive("safe")}
          className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${
            active === "safe"
              ? "bg-green-600 text-white pulse-safe"
              : "bg-green-600/20 text-green-400 hover:bg-green-600/40 border border-green-600/50"
          }`}
        >
          ✅ Buy Safe Skill
        </button>
        <button
          onClick={() => setActive("tampered")}
          className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${
            active === "tampered"
              ? "bg-red-600 text-white pulse-danger"
              : "bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-600/50"
          }`}
        >
          🚨 Buy Tampered Skill
        </button>
      </div>

      {/* Content */}
      {demo && scan && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">{demo.title}</h2>
            <p className="text-gray-400">{demo.subtitle}</p>
          </div>

          {/* SafeGuard Scan Report */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-300">
              SafeGuard Scan Report
            </h3>
            <ScanReport scan={scan} />
          </div>

          {/* Storyboard */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-300">
              On-Chain Storyboard
            </h3>
            <Timeline demo={demo} />
          </div>

          {/* Receipt link */}
          <div className="text-center pt-4">
            <a
              href={`/receipt/${active}`}
              className="inline-block px-6 py-3 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-600/50 font-semibold transition-all"
            >
              📋 View Shareable Receipt →
            </a>
          </div>
        </div>
      )}

      {/* Contracts */}
      <div className="mt-12 border-t border-gray-800 pt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-300">
          Deployed Contracts (Base Sepolia)
        </h3>
        <div className="space-y-2">
          {Object.values(CONTRACTS).map((c) => (
            <div key={c.address} className="flex items-center gap-2">
              <span className="text-gray-400 text-sm w-52">{c.name}</span>
              <a
                href={`${BASESCAN}/address/${c.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs font-mono"
              >
                {c.address}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Reproduce */}
      <div className="mt-8 border-t border-gray-800 pt-8">
        <h3 className="text-lg font-semibold mb-2 text-gray-300">
          Reproduce in 30 seconds
        </h3>
        <pre className="bg-gray-900 rounded-lg p-4 text-sm text-green-400 overflow-x-auto">
{`git clone https://github.com/afafw/usdc-hackathon-smartcontract-arb
cd usdc-hackathon-smartcontract-arb
forge test -vv                    # 5 passing tests
./scripts/demo-flow.sh            # happy-path escrow
./scripts/passport-dispute-live.sh # dispute + passport`}
        </pre>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>
          #USDCHackathon · AgenticCommerce Track ·{" "}
          <a
            href="https://github.com/afafw/usdc-hackathon-agentic-commerce"
            className="text-blue-500 hover:text-blue-400"
            target="_blank"
          >
            GitHub
          </a>{" "}
          ·{" "}
          <a
            href="https://www.moltbook.com/post/3540bfc3-53e0-4250-b5fb-f310cb5e6dfc"
            className="text-blue-500 hover:text-blue-400"
            target="_blank"
          >
            Moltbook
          </a>
        </p>
      </div>
    </main>
  );
}
