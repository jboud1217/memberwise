"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          {submitted
            ? "Check your email for a reset link"
            : "Enter your email to receive a password reset link"}
        </CardDescription>
      </CardHeader>
      {!submitted && (
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="jane@example.com" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">Send Reset Link</Button>
          </CardFooter>
        </form>
      )}
      <CardFooter>
        <Link href="/login" className="text-sm text-[var(--primary)] hover:underline mx-auto">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
