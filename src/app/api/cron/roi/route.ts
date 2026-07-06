import { NextResponse, type NextRequest } from "next/server";
import { roiSchedulerService } from "@/lib/services/roi-scheduler.service";

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const querySecret = request.nextUrl.searchParams.get("secret");
  return querySecret === secret;
}

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";
  const recovery = request.nextUrl.searchParams.get("recovery") === "true";
  const investmentId = request.nextUrl.searchParams.get("investmentId") ?? undefined;

  const result = await roiSchedulerService.run({
    dryRun,
    recovery,
    investmentId,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.message, code: result.error.code },
      { status: 503 },
    );
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
