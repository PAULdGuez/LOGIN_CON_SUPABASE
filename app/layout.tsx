import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Práctica Supabase',
  description: 'Aplicación para practicar CRUD, autenticación, RLS y RPC con Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
