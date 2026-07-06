import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile, getSessionUser } from "@/lib/auth/session";

const modules = [
  { href: "/hard/auth/deposits", title: "Deposits", desc: "Review and approve deposit requests" },
  { href: "/hard/auth/withdrawals", title: "Withdrawals", desc: "Process withdrawal queue" },
  { href: "/hard/auth/investments", title: "Investments", desc: "Manage active positions" },
  { href: "/hard/auth/treasury", title: "Treasury", desc: "Payout queue and treasury stats" },
  { href: "/hard/auth/ledger", title: "Ledger Explorer", desc: "Immutable financial entries" },
  { href: "/hard/auth/referrals", title: "Referral Commissions", desc: "Referral graph and payouts" },
  { href: "/hard/auth/reports?tab=roi", title: "ROI Processing", desc: "Scheduled ROI run history" },
];

export default async function OperationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/hard/auth/login");
  const admin = await getAdminProfile(user.authUserId);
  if (!admin) redirect("/hard/auth/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Financial Operations Center</h1>
      <p className="text-slate-400">
        Central hub for all financial workflows. Every action is ledger-driven and audited.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition-colors hover:border-slate-600"
          >
            <h2 className="font-semibold">{m.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
