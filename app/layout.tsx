import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Control Ganadero',
  description: 'Sistema para el control y gestión de ganado',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
          {children}
        </main>
      </body>
    </html>
  )
}