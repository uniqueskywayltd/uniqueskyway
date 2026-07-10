import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/auth/constants";

export default function CheckEmailRedirect() {
  redirect(AUTH_ROUTES.register);
}
