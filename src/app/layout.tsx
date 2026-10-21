import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { IOSActiveStateFix } from "@/components/IOSActiveStateFix";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trip Planner",
  description: "Optimal route planning for visiting multiple places on a trip",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trip Planner",
  },
  // Chrome deprecated apple-mobile-web-app-capable (still needed for actual iOS Safari) in
  // favor of this standard tag — `appleWebApp` above only emits the old one.
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Runs before first paint so a stored preference applies immediately, no flash of the wrong theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
  var t = localStorage.getItem('theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}`,
          }}
        />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
        <IOSActiveStateFix />
        {/* Page views and Core Web Vitals from real visitors. Both are cookieless and only send
            data from Vercel deployments, so local development stays silent. They still need Web
            Analytics and Speed Insights switched on for the project in the Vercel dashboard —
            the components alone don't enable collection. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
