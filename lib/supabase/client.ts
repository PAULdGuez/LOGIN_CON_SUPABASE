import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate that Supabase credentials are configured
const isValidUrl = (url: string) => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

export function createClient() {
    if (!isValidUrl(supabaseUrl)) {
        // Return a mock client that throws meaningful errors
        console.warn('Supabase URL not configured. Please set NEXT_PUBLIC_SUPABASE_URL in .env.local')
    }

    return createBrowserClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder-key'
    )
}
