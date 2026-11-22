import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import OfflineBanner from "@/components/OfflineBanner";
import { WebVitals } from "@/components/WebVitals";
import { ThemeProvider, Theme } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IMDb Clone | ElevanceSkills Internship",
  description: "IMDb Clone built with Next.js, Tailwind CSS, and Framer Motion",
};

export const instant = false;

async function getThemeCookie(): Promise<Theme> {
  try {
    const cookieStore = await cookies();
    return (cookieStore.get("theme")?.value as Theme) || "system";
  } catch {
    return "system";
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeCookie = await getThemeCookie();
  let nonce: string | undefined;
  try {
    const headersList = await headers();
    nonce = headersList.get("x-nonce") || undefined;
  } catch {
    nonce = undefined;
  }
  const initialDataTheme = themeCookie === "system" ? "dark" : themeCookie;

  return (
    <html
      lang="en"
      data-theme={initialDataTheme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var m = document.cookie.match(/(^|;\\s*)theme=([^;]+)/);
                  var t = m ? m[2] : localStorage.getItem('theme') || 'system';
                  var r = t;
                  if (t === 'system') {
                    r = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', r);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-theme-bg text-theme-fg">
        <ThemeProvider initialTheme={themeCookie}>
          <Providers>
            <WebVitals />
            <OfflineBanner />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
