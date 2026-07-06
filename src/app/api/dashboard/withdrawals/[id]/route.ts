import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer } from "@/lib/auth/api-guard";
import { withdrawalService } from "@/lib/services/withdrawal.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await withdrawalService.getByIdForProfile(auth.ctx.profile.id, id);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();

  if (body.action === "cancel") {
    const result = await withdrawalService.cancelWithdrawal(
      auth.ctx.profile.id,
      id,
      { profileId: auth.ctx.profile.id },
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
