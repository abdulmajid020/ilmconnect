import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "IlmConnect Admin & Teacher Portal | Islamic Marketplace & Live Madrassa",
  description:
    "Administrative verification desk and scholar workspace for live Madrassa classes, 1-on-1 mentorship, and Islamic Q&A fatwa board.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#FAF9F5] text-stone-900 font-sans">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
