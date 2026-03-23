import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordForm from "./reset-form";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
