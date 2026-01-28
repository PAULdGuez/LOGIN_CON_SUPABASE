'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/lib/types'

interface EditUserModalProps {
    user: (Profile & { email: string }) | null
    isOpen: boolean
    onClose: () => void
    onSave: (userId: string, data: { name: string; password?: string; role: 'user' | 'admin' }) => void
}

export default function EditUserModal({ user, isOpen, onClose, onSave }: EditUserModalProps) {
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<'user' | 'admin'>('user')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (user) {
            setName(user.name)
            setRole(user.role)
            setPassword('')
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            await onSave(user.id, {
                name,
                password: password || undefined,
                role,
            })
            onClose()
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !user) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Editar Usuario</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={user.email}
                                disabled
                                style={{ backgroundColor: 'var(--color-gray-100)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nombre</label>
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nueva Contraseña (opcional)</label>
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Dejar vacío para mantener la actual"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Rol</label>
                            <select
                                className="input"
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                            >
                                <option value="user">Usuario</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
