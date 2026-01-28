import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import StoreProvider from "@/providers/storeProvider";
import ClientLayout from "@/components/ClientLayout";
import CompletionFeatureProvider from "@/providers/CompletionFeatureProvider";

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
        <StoreProvider>
          <ToastProvider>
            <CompletionFeatureProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </CompletionFeatureProvider>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
