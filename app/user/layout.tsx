'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import { Profile, SidebarItem } from '@/lib/types'

const userMenuItems: SidebarItem[] = [
    { label: 'PRINCIPAL', href: '/user', icon: '🏠' },
    { label: 'SUBIR ARCHIVOS', href: '/user/upload', icon: '📤' },
]

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setEmail(user.email || '')
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(profile)
            }
            setLoading(false)
        }
        loadProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    if (loading) {
        return (
            <div className="login-container">
                <p>Cargando...</p>
            </div>
        )
    }

    return (
        <div className="dashboard-layout">
            <Sidebar
                items={userMenuItems}
                title="Panel de Usuario"
                userName={profile?.name || 'Usuario'}
                userEmail={email}
                onLogout={handleLogout}
            />
            <main className="main-content">
                {children}
            </main>
        </div>
    )
}
