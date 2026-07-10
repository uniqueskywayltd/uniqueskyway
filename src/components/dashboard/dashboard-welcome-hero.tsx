import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getAvatarUrl, getInitials } from "@/lib/utils/avatar";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type DashboardWelcomeHeroProps = {
  fullName: string;
  username: string;
  avatarPath: string | null;
  className?: string;
};

export function DashboardWelcomeHero({
  fullName,
  username,
  avatarPath,
  className,
}: DashboardWelcomeHeroProps) {
  const initials = getInitials(fullName);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        className,
      )}
      aria-label="Welcome"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_42%),linear-gradient(225deg,rgba(245,158,11,0.14)_0%,transparent_55%)] opacity-[0.22] dark:opacity-[0.35]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.55),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_55%)]"
        aria-hidden
      />

      <div className="relative flex items-center gap-5 p-5 sm:gap-6 sm:p-6 md:p-7">
        <div className="relative shrink-0">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/30 via-amber-500/20 to-transparent blur-sm" aria-hidden />
          <Avatar className="relative h-16 w-16 rounded-2xl ring-1 ring-border/80 ring-offset-2 ring-offset-card sm:h-[4.5rem] sm:w-[4.5rem]">
            <AvatarImage src={getAvatarUrl(avatarPath)} alt="" className="rounded-2xl object-cover" />
            <AvatarFallback className="rounded-2xl bg-primary/10 text-base font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Unique Sky Way · Investor
          </p>
          <p className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {fullName}
          </p>
          <p className="mt-0.5 truncate text-sm text-primary/90">@{username}</p>
          <p className="mt-3 text-sm font-medium text-muted-foreground">{getGreeting()}</p>
        </div>
      </div>

      <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" aria-hidden />
    </section>
  );
}
