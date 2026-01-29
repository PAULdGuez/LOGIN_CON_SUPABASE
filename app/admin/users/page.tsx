'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, AuditLog } from '@/lib/types'
import ToggleSwitch from '@/components/ToggleSwitch'
import UserTable from '@/components/UserTable'
import EditUserModal from '@/components/EditUserModal'
import AuditLogTable from '@/components/AuditLogTable'

export const dynamic = 'force-dynamic'

type UserWithEmail = Profile & { email: string }

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserWithEmail[]>([])
    const [loading, setLoading] = useState(true)
    const [editEnabled, setEditEnabled] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserWithEmail | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

    // Audit Log state
    const [showAuditLog, setShowAuditLog] = useState(false)
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [auditLoading, setAuditLoading] = useState(false)

    const supabase = useMemo(() => createClient(), [])

    const loadUsers = useCallback(async () => {
        // Get all profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (profilesError) {
            console.error('Error loading profiles:', profilesError)
            return []
        }

        // Get user emails from auth.users via RPC function
        const { data: userEmails, error: emailsError } = await supabase
            .rpc('get_user_emails')

        if (emailsError) {
            console.error('Error loading emails:', emailsError)
            // If RPC fails, load profiles without emails
            return profiles?.map(profile => ({
                ...profile,
                email: 'Email no disponible'
            })) || []
        }

        // Merge profiles with emails
        const emailMap = new Map(userEmails?.map((u: { id: string; email: string }) => [u.id, u.email]))
        return profiles?.map(profile => ({
            ...profile,
            email: emailMap.get(profile.id) || 'Email no disponible'
        })) || []
    }, [supabase])

    // Load audit logs
    const loadAuditLogs = useCallback(async () => {
        setAuditLoading(true)
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('changed_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error loading audit logs:', error)
        } else {
            setAuditLogs(data || [])
        }
        setAuditLoading(false)
    }, [supabase])

    // Initial load
    useEffect(() => {
        const initialLoad = async () => {
            setLoading(true)
            const usersData = await loadUsers()
            setUsers(usersData)
            setLoading(false)
        }
        initialLoad()
    }, [loadUsers])

    // Load audit logs when toggle is enabled
    useEffect(() => {
        if (showAuditLog) {
            loadAuditLogs()
        }
    }, [showAuditLog, loadAuditLogs])

    // Realtime subscription for profiles
    useEffect(() => {
        console.log('🔄 Setting up Realtime subscription...')

        const channel = supabase
            .channel('profiles-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles'
                },
                async (payload) => {
                    console.log('📡 Realtime event received:', payload.eventType, payload)
                    const updatedUsers = await loadUsers()
                    setUsers(updatedUsers)

                    // Also refresh audit logs if visible
                    if (showAuditLog) {
                        await loadAuditLogs()
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Realtime subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    setRealtimeStatus('connected')
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setRealtimeStatus('disconnected')
                } else {
                    setRealtimeStatus('connecting')
                }
            })

        return () => {
            console.log('🔄 Cleaning up Realtime subscription...')
            supabase.removeChannel(channel)
        }
    }, [supabase, loadUsers, loadAuditLogs, showAuditLog])

    const handleEdit = (user: UserWithEmail) => {
        setSelectedUser(user)
        setModalOpen(true)
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            return
        }

        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId)

            if (profileError) throw profileError

            const { error: authError } = await supabase.rpc('delete_user', {
                user_id: userId
            })

            if (authError) {
                console.error('Error deleting auth user:', authError)
            }
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Error al eliminar el usuario')
        }
    }

    const handleSave = async (userId: string, data: { name: string; password?: string; role: 'user' | 'admin' }) => {
        try {
            const { error: profileError } = await supabase.rpc('admin_update_profile', {
                target_user_id: userId,
                new_name: data.name,
                new_role: data.role,
            })

            if (profileError) throw profileError

            if (data.password) {
                const { error: passwordError } = await supabase.rpc('update_user_password', {
                    user_id: userId,
                    new_password: data.password,
                })

                if (passwordError) {
                    console.error('Error updating password:', passwordError)
                    alert('Perfil actualizado, pero hubo un error al cambiar la contraseña')
                }
            }

            setModalOpen(false)
            setSelectedUser(null)
        } catch (error) {
            console.error('Error saving user:', error)
            const errorMessage = (error as { message?: string })?.message || 'Error al guardar los cambios'
            alert(errorMessage)
        }
    }

    if (loading) {
        return (
            <div className="welcome-container">
                <p>Cargando usuarios...</p>
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    Administrar Usuarios
                    <span className={`realtime-indicator ${realtimeStatus}`} title={`Realtime: ${realtimeStatus}`}>
                        ●
                    </span>
                </h1>
            </div>

            <div className="toggles-container">
                <ToggleSwitch
                    isActive={editEnabled}
                    onToggle={() => setEditEnabled(!editEnabled)}
                    label="Editar Usuarios"
                />
                <ToggleSwitch
                    isActive={showAuditLog}
                    onToggle={() => setShowAuditLog(!showAuditLog)}
                    label="Ver Historial de Cambios"
                />
            </div>

            <UserTable
                users={users}
                editEnabled={editEnabled}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showAuditLog && (
                <>
                    <h2 className="page-title mt-md" style={{ marginTop: 'var(--spacing-xl)' }}>
                        📋 Historial de Cambios
                    </h2>
                    <AuditLogTable logs={auditLogs} loading={auditLoading} />
                </>
            )}

            <EditUserModal
                user={selectedUser}
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false)
                    setSelectedUser(null)
                }}
                onSave={handleSave}
            />
        </div>
    )
}
