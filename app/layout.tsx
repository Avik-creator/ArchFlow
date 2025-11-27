import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ArchFlow - Privacy-First Architecture Designer",
  description:
    "Design and simulate system architecture diagrams with an intuitive drag-and-drop interface. 100% private - your data never leaves your browser.",
  keywords: [
    "architecture",
    "diagram",
    "system design",
    "privacy",
    "local-first",
    "drag and drop",
    "flow simulation",
    "API testing",
    "real-time collaboration",
    "AI assistant",
  ],
  authors: [{ name: "ArchFlow" }],
  creator: "ArchFlow",
  publisher: "ArchFlow",
  metadataBase: new URL("https://archflow.avikmukherjee.me"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ArchFlow - Design System Architecture Visually",
    description:
      "Build, visualize, and test your system architecture with an intuitive drag-and-drop interface. Connect to real APIs, simulate data flows, and iterate fast — all while keeping your designs completely private.",
    type: "website",
    url: "https://archflow.avikmukherjee.me",
    siteName: "ArchFlow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ArchFlow - Design System Architecture Visually",
        type: "image/png",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ArchFlow - Design System Architecture Visually",
    description:
      "Build, visualize, and test your system architecture with drag-and-drop. Connect to APIs, simulate data flows, and collaborate in real-time. 100% private.",
    images: ["/og-image.png"],
    creator: "@archflow",
    site: "@archflow",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.jpg",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
