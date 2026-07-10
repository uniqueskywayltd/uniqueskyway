import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/api-guard";
import { adminCreateCustomerSchema } from "@/lib/auth/validation";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { customerAdminService } from "@/lib/services/customer-admin.service";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.USERS_READ);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const result = await customerAdminService.listForAdmin({
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 20),
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(PERMISSIONS.USERS_WRITE);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = adminCreateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await customerAdminService.createCustomer({
    data: parsed.data,
    adminUserId: auth.ctx.adminId,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 201 });
}
