import "dotenv/config";
import { getDb } from "../src/db";
import { activityFeed } from "../src/db/schema";

const FIRST_NAMES = [
  "James", "Oliver", "Charlotte", "Emily", "Liam", "Noah", "Sophia", "Ethan",
  "Ava", "Mason", "Harper", "Logan", "Amelia", "Benjamin", "Evelyn", "Henry",
  "Abigail", "Sebastian", "Grace", "Jack", "Chloe", "Michael", "Sarah", "John",
  "Emma", "Daniel", "Olivia", "Matthew", "Hannah", "Andrew", "Victoria", "Ryan",
];

const LAST_INITIALS = "ABCDEFGHJKLMNPRSTW";

const USA_LOCATIONS = [
  { city: "Austin", state: "Texas" },
  { city: "Miami", state: "Florida" },
  { city: "Denver", state: "Colorado" },
  { city: "Seattle", state: "Washington" },
  { city: "Phoenix", state: "Arizona" },
  { city: "Chicago", state: "Illinois" },
  { city: "Boston", state: "Massachusetts" },
  { city: "Atlanta", state: "Georgia" },
  { city: "Dallas", state: "Texas" },
  { city: "San Diego", state: "California" },
  { city: "Nashville", state: "Tennessee" },
  { city: "Charlotte", state: "North Carolina" },
  { city: "Portland", state: "Oregon" },
  { city: "Las Vegas", state: "Nevada" },
  { city: "Minneapolis", state: "Minnesota" },
];

const PLANS = ["Silver Plan", "Gold Plan", "Classic Plan", "Master Plan"];

function pick<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length]!;
}

function maskName(first: string, lastInitial: string): string {
  return `${first} ${lastInitial}.`;
}

function randomAmount(type: string, seed: number): string | null {
  if (type === "registration") return null;
  const bases = [500, 1000, 1500, 2500, 5000, 7500, 10000, 15000, 25000];
  const base = pick(bases, seed);
  const variance = (seed % 7) * 50;
  return String(base + variance);
}

async function main() {
  const db = getDb();
  const rows: (typeof activityFeed.$inferInsert)[] = [];

  for (let i = 0; i < 100; i++) {
    const types = ["registration", "deposit", "withdrawal", "investment"] as const;
    const type = pick(types, i + 3);
    const first = pick(FIRST_NAMES, i * 7);
    const lastInitial = LAST_INITIALS[i % LAST_INITIALS.length]!;
    const loc = pick(USA_LOCATIONS, i * 11);
    const hoursAgo = (i % 72) + 1 + (i % 5);
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const titles: Record<typeof type, string> = {
      registration: "New Member",
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      investment: "Investment",
    };

    rows.push({
      type,
      title: titles[type],
      customerNameMasked: maskName(first, lastInitial),
      city: type === "registration" || type === "withdrawal" ? loc.city : null,
      country:
        type === "registration" || type === "withdrawal"
          ? `${loc.state}, USA`
          : null,
      amount: randomAmount(type, i),
      currency: "USD",
      investmentPlan: type === "investment" ? pick(PLANS, i) : null,
      isSeed: true,
      isVisible: true,
      priority: 0,
      createdAt,
      updatedAt: createdAt,
    });
  }

  await db.insert(activityFeed).values(rows);
  console.log(`✓ Seeded ${rows.length} activity feed records`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
