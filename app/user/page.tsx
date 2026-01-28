'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default function UserDashboard() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(profile)
            }
        }
        loadProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase])

    return (
        <div className="welcome-container">
            <h1 className="welcome-title">Hola Usuario</h1>
            <p className="welcome-name">{profile?.name || 'Cargando...'}</p>
        </div>
    )
}
