import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import StoreProvider from "@/providers/storeProvider";
import ClientLayout from "@/components/ClientLayout";
import CompletionFeatureProvider from "@/providers/CompletionFeatureProvider";
import DashboardFeatureProvider from "@/providers/DashboardFeatureProvider";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { NetworkStatusProvider } from "@/providers/NetworkStatusProvider";
import QueryProvider from "@/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NetworkStatusProvider>
          <ErrorBoundary>
            <StoreProvider>
              <QueryProvider>
                <ToastProvider>
                  <DashboardFeatureProvider>
                    <CompletionFeatureProvider>
                      <ClientLayout>
                        {children}
                      </ClientLayout>
                    </CompletionFeatureProvider>
                  </DashboardFeatureProvider>
                </ToastProvider>
              </QueryProvider>
            </StoreProvider>
          </ErrorBoundary>
        </NetworkStatusProvider>
      </body>
    </html>
  );
}
