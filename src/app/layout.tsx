import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { GatewayProvider } from "@/lib/GatewayContext";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "AgentBox - AI Agent Management Platform",
  description: "Create and manage your AI agents in clicks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <I18nProvider>
            <GatewayProvider>
              {children}
            </GatewayProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
