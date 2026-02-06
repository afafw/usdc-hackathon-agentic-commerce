import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InstallToPay — Pay only after safe install",
  description:
    "Agent skill delivery meets USDC escrow. SafeGuard scans the skill, USDC releases only if safe. Dispute if tampered.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
