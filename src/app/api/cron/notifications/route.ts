import { NextResponse, type NextRequest } from "next/server";
import { notificationProcessorService } from "@/lib/services/notification-processor.service";

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return request.nextUrl.searchParams.get("secret") === secret;
}

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await notificationProcessorService.processAll();

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
