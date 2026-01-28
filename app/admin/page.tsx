'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import TypewriterText from '@/components/TypewriterText'

export const dynamic = 'force-dynamic'

export default function AdminDashboard() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [animationKey, setAnimationKey] = useState(0)
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
                // Reset animation when profile loads
                setAnimationKey(prev => prev + 1)
            }
        }
        loadProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase])

    const welcomeText = profile ? `Bienvenido Administrador, ${profile.name}` : '...'

    return (
        <div className="welcome-container">
            <h1 className="welcome-title" key={animationKey}>
                <TypewriterText text={welcomeText} speed={60} />
            </h1>
        </div>
    )
}
