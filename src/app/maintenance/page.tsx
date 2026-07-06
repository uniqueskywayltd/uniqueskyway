import Link from "next/link";
import { Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Wrench className="h-7 w-7 text-primary" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold">Under maintenance</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Unique Sky Way is currently undergoing scheduled maintenance. Please check
        back shortly.
      </p>
      <Link href="/login" className={buttonVariants({ variant: "outline", className: "mt-8" })}>
        Admin sign in
      </Link>
    </div>
  );
}
