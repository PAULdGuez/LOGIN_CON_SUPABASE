import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Protected routes
    if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/user'))) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // If user is logged in, check role and redirect accordingly
    if (user && (pathname.startsWith('/admin') || pathname.startsWith('/user'))) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        console.log('Middleware - User ID:', user.id, 'Profile:', profile, 'Error:', error)

        if (profile) {
            // Admin trying to access user pages
            if (pathname.startsWith('/user') && profile.role === 'admin') {
                console.log('Redirecting admin from /user to /admin')
                const url = request.nextUrl.clone()
                url.pathname = '/admin'
                return NextResponse.redirect(url)
            }

            // User trying to access admin pages
            if (pathname.startsWith('/admin') && profile.role !== 'admin') {
                const url = request.nextUrl.clone()
                url.pathname = '/user'
                return NextResponse.redirect(url)
            }
        }
    }

    // Redirect logged in users away from login page
    if (user && pathname === '/') {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        console.log('Middleware (login redirect) - Profile:', profile, 'Error:', error)

        const url = request.nextUrl.clone()
        url.pathname = profile?.role === 'admin' ? '/admin' : '/user'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
