import { notFound } from "next/navigation";
import {
  SAFE_DEMO,
  TAMPERED_DEMO,
  SAFE_SCAN,
  TAMPERED_SCAN,
  BASESCAN,
  CONTRACTS,
  type Demo,
} from "@/lib/demos";
import type { Metadata } from "next";

const demos: Record<string, { demo: Demo; scan: typeof SAFE_SCAN | typeof TAMPERED_SCAN }> = {
  safe: { demo: SAFE_DEMO, scan: SAFE_SCAN },
  tampered: { demo: TAMPERED_DEMO, scan: TAMPERED_SCAN },
};

export async function generateStaticParams() {
  return [{ id: "safe" }, { id: "tampered" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = demos[id];
  if (!d) return { title: "Not Found" };
  return {
    title: `Receipt: ${d.demo.title} — InstallToPay`,
    description: d.demo.subtitle,
  };
}

function TxRow({ label, desc, tx, status }: { label: string; desc: string; tx: string; status: string }) {
  const colors = {
    success: "border-green-600/40 bg-green-950/20",
    blocked: "border-red-600/40 bg-red-950/20",
    disputed: "border-yellow-600/40 bg-yellow-950/20",
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[status as keyof typeof colors] || colors.success}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-white">{label}</h4>
          <p className="text-gray-400 text-sm mt-1">{desc}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded font-mono ${
          status === "success" ? "bg-green-600/30 text-green-300" :
          status === "blocked" ? "bg-red-600/30 text-red-300" :
          "bg-yellow-600/30 text-yellow-300"
        }`}>
          {status.toUpperCase()}
        </span>
      </div>
      {tx ? (
        <a
          href={`${BASESCAN}/tx/${tx}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-xs font-mono mt-2 block break-all"
        >
          {tx}
        </a>
      ) : (
        <span className="text-gray-500 text-xs mt-2 block">off-chain verification</span>
      )}
    </div>
  );
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = demos[id];
  if (!entry) notFound();

  const { demo, scan } = entry;
  const blocked = scan.verdict === "BLOCK";

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">InstallToPay Receipt</p>
        <h1 className="text-3xl font-bold mb-2">{demo.title}</h1>
        <p className="text-gray-400">{demo.subtitle}</p>
      </div>

      {/* SafeGuard Scan */}
      <div className={`rounded-lg border p-5 mb-8 ${
        blocked ? "border-red-500/50 bg-red-950/30" : "border-green-500/50 bg-green-950/30"
      }`}>
        <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wider mb-3">
          SafeGuard Scan Report
        </h3>
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-xl font-bold ${blocked ? "text-red-400" : "text-green-400"}`}>
            {blocked ? "🚨 BLOCK" : "✅ ALLOW"}
          </span>
          <span className="text-gray-400 text-sm">
            {scan.skillName} v{scan.version}
          </span>
        </div>
        {scan.flags.length > 0 && (
          <ul className="space-y-1 mb-3">
            {scan.flags.map((f, i) => (
              <li key={i} className="text-red-300 text-sm font-mono">{f}</li>
            ))}
          </ul>
        )}
        <p className="text-gray-300 text-sm">{scan.summary}</p>
      </div>

      {/* Transaction Timeline */}
      <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wider mb-4">
        Transaction Evidence Chain
      </h3>
      <div className="space-y-3 mb-8">
        {demo.steps.map((step, i) => (
          <TxRow key={i} {...step} />
        ))}
      </div>

      {/* Final Outcome */}
      <div className={`rounded-lg border p-5 mb-8 ${
        demo.outcome === "released"
          ? "border-green-500/50 bg-green-950/30"
          : "border-yellow-500/50 bg-yellow-950/30"
      }`}>
        <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wider mb-3">
          Outcome
        </h3>
        <p className="text-xl font-bold mb-4">{demo.outcomeEmoji} {demo.outcomeLabel}</p>
        <div className="space-y-2">
          {demo.balances.map((b, i) => (
            <div key={i} className="flex items-center gap-4 text-sm">
              <span className="text-gray-400 w-36">{b.role}</span>
              <span className="text-gray-500">{b.before}</span>
              <span className="text-gray-600">→</span>
              <span className="text-white font-bold">{b.after}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contracts */}
      <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wider mb-4">
        Verified Contracts
      </h3>
      <div className="space-y-2 mb-8">
        {Object.values(CONTRACTS).map((c) => (
          <div key={c.address} className="flex items-center gap-2">
            <span className="text-gray-400 text-sm w-48">{c.name}</span>
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

      {/* Footer */}
      <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm space-y-2">
        <p>
          <a href="/" className="text-blue-400 hover:text-blue-300">← Back to demo</a>
        </p>
        <p>
          #USDCHackathon · AgenticCommerce Track ·{" "}
          <a
            href="https://github.com/afafw/usdc-hackathon-agentic-commerce"
            className="text-blue-500 hover:text-blue-400"
            target="_blank"
          >
            GitHub
          </a>
        </p>
      </div>
    </main>
  );
}
