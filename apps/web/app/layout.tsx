import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import AppShell from "./components/AppShell";

export const metadata: Metadata = {
  title: "ProjectVault",
  description: "Your private workspace for projects, notes, and links.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
