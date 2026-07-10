export type LiveAccrualInput = {
  status: string;
  isPaused?: boolean;
  principalAmount: string;
  accruedInterest: string;
  dailyRoiPercent: string;
  compounding: boolean;
  startedAt: string | Date | null;
  lastAccrualAt: string | Date | null;
  lockPeriodDays: number;
  durationDays: number;
  maturesAt: string | Date | null;
};

export type LiveAccrualState = {
  creditedTotal: number;
  liveTotal: number;
  todayAccrual: number;
  dailyEarnings: number;
  cycleDay: number;
  dayProgressPercent: number;
  nextAccrualInMs: number;
  isAccruing: boolean;
  periodEndsAt: Date | null;
  lockEndsAt: Date | null;
};

function parseNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function calculateDailyRoi(
  principal: number,
  accrued: number,
  dailyRoiPercent: number,
  compounding: boolean,
): number {
  const base = compounding ? principal + accrued : principal;
  return (base * dailyRoiPercent) / 100;
}

export function calculateLiveAccrualState(
  input: LiveAccrualInput,
  now: Date = new Date(),
): LiveAccrualState {
  const principal = parseNum(input.principalAmount);
  const creditedTotal = parseNum(input.accruedInterest);
  const startedAt = toDate(input.startedAt);
  const maturesAt = toDate(input.maturesAt);
  const lastAccrualAt = toDate(input.lastAccrualAt);
  const lockEndsAt = startedAt ? addDays(startedAt, input.lockPeriodDays) : null;

  const dailyEarnings = calculateDailyRoi(
    principal,
    creditedTotal,
    parseNum(input.dailyRoiPercent),
    input.compounding,
  );

  const inactive =
    input.status !== "active" ||
    input.isPaused ||
    !startedAt ||
    (maturesAt && now >= maturesAt);

  if (inactive || !lockEndsAt || now < lockEndsAt) {
    return {
      creditedTotal,
      liveTotal: creditedTotal,
      todayAccrual: 0,
      dailyEarnings,
      cycleDay: 0,
      dayProgressPercent: 0,
      nextAccrualInMs: lockEndsAt ? Math.max(0, lockEndsAt.getTime() - now.getTime()) : 0,
      isAccruing: false,
      periodEndsAt: lockEndsAt,
      lockEndsAt,
    };
  }

  const periodStart = lastAccrualAt ?? lockEndsAt;
  const periodEnd = addDays(periodStart, 1);
  const periodMs = periodEnd.getTime() - periodStart.getTime();
  const elapsedMs = Math.min(Math.max(0, now.getTime() - periodStart.getTime()), periodMs);
  const progress = periodMs > 0 ? elapsedMs / periodMs : 0;

  const todayAccrual = dailyEarnings * progress;
  const liveTotal = creditedTotal + todayAccrual;

  const msSinceLockEnd = now.getTime() - lockEndsAt.getTime();
  const completedDays = Math.floor(msSinceLockEnd / 86400000);
  const cycleDay = Math.min(input.durationDays, completedDays + 1);

  return {
    creditedTotal,
    liveTotal,
    todayAccrual,
    dailyEarnings,
    cycleDay,
    dayProgressPercent: Math.round(progress * 100),
    nextAccrualInMs: Math.max(0, periodEnd.getTime() - now.getTime()),
    isAccruing: true,
    periodEndsAt: periodEnd,
    lockEndsAt,
  };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
