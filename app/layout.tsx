import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FilesProvider } from "@/components/context/files-context";
import { ToolsProvider } from "@/components/context/tools-context";
import { ConversationsProvider } from "@/components/context/conversations-context";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Responses starter app",
  description: "Starter app for the OpenAI Responses API",
  icons: {
    icon: "/openai_logo.svg",
  },
};

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
        <FilesProvider>
          <ToolsProvider>
            <ConversationsProvider>
              <div className="flex h-screen bg-gray-200 w-full flex-col text-stone-900">
                <main>{children}</main>
              </div>
            </ConversationsProvider>
          </ToolsProvider>
        </FilesProvider>
      </body>
    </html>
  );
}
