import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import { LenisProvider } from "@/components/LenisProvider"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-playfair",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Riverwood Projects — AI Customer Connect",
  description:
    "Premium land development. Experience our AI agent — personalised outbound calling, instantly.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  )
}
