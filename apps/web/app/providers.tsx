"use client";

import { AuthProvider } from "@digit-auth/react";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const apiUrl = process.env.NEXT_PUBLIC_DIGIT_AUTH_API_URL;
  const publishableKey = process.env.NEXT_PUBLIC_DIGIT_AUTH_PUBLISHABLE_KEY;

  if (!apiUrl || !publishableKey) {
    throw new Error("DigitAuth environment variables are missing.");
  }

  return (
    <AuthProvider apiUrl={apiUrl} publishableKey={publishableKey}>
      {children}
    </AuthProvider>
  );
}
