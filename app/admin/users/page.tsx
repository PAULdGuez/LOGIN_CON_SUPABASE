'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import ToggleSwitch from '@/components/ToggleSwitch'
import UserTable from '@/components/UserTable'
import EditUserModal from '@/components/EditUserModal'

export const dynamic = 'force-dynamic'

type UserWithEmail = Profile & { email: string }

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserWithEmail[]>([])
    const [loading, setLoading] = useState(true)
    const [editEnabled, setEditEnabled] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserWithEmail | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const supabase = useMemo(() => createClient(), [])

    const loadUsers = useCallback(async () => {
        setLoading(true)

        // Get all profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (profilesError) {
            console.error('Error loading profiles:', profilesError)
            setLoading(false)
            return
        }

        // Get user emails from auth.users via RPC function
        const { data: userEmails, error: emailsError } = await supabase
            .rpc('get_user_emails')

        if (emailsError) {
            console.error('Error loading emails:', emailsError)
            // If RPC fails, load profiles without emails
            const usersWithEmails = profiles?.map(profile => ({
                ...profile,
                email: 'Email no disponible'
            })) || []
            setUsers(usersWithEmails)
            setLoading(false)
            return
        }

        // Merge profiles with emails
        const emailMap = new Map(userEmails?.map((u: { id: string; email: string }) => [u.id, u.email]))
        const usersWithEmails = profiles?.map(profile => ({
            ...profile,
            email: emailMap.get(profile.id) || 'Email no disponible'
        })) || []

        setUsers(usersWithEmails)
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    const handleEdit = (user: UserWithEmail) => {
        setSelectedUser(user)
        setModalOpen(true)
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            return
        }

        try {
            // Delete profile first
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId)

            if (profileError) throw profileError

            // Call RPC to delete auth user
            const { error: authError } = await supabase.rpc('delete_user', {
                user_id: userId
            })

            if (authError) {
                console.error('Error deleting auth user:', authError)
            }

            // Reload users
            await loadUsers()
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Error al eliminar el usuario')
        }
    }

    const handleSave = async (userId: string, data: { name: string; password?: string; role: 'user' | 'admin' }) => {
        try {
            // Update profile using RPC function (bypasses RLS)
            const { error: profileError } = await supabase.rpc('admin_update_profile', {
                target_user_id: userId,
                new_name: data.name,
                new_role: data.role,
            })

            if (profileError) throw profileError

            // Update password if provided
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

            // Reload users
            await loadUsers()
        } catch (error) {
            console.error('Error saving user:', error)
            alert('Error al guardar los cambios')
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
                <h1 className="page-title">Administrar Usuarios</h1>
            </div>

            <ToggleSwitch
                isActive={editEnabled}
                onToggle={() => setEditEnabled(!editEnabled)}
                label="Habilitar edición"
            />

            <UserTable
                users={users}
                editEnabled={editEnabled}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

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
