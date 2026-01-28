'use client'

import { Profile } from '@/lib/types'

interface UserTableProps {
    users: (Profile & { email: string })[]
    editEnabled: boolean
    onEdit: (user: Profile & { email: string }) => void
    onDelete: (userId: string) => void
}

export default function UserTable({ users, editEnabled, onEdit, onDelete }: UserTableProps) {
    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Fecha de Registro</th>
                        {editEnabled && <th>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                                    {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                                </span>
                            </td>
                            <td>{new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                            {editEnabled && (
                                <td>
                                    <div className="actions">
                                        <button className="btn btn-sm" onClick={() => onEdit(user)}>
                                            Editar
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => onDelete(user.id)}>
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan={editEnabled ? 5 : 4} className="text-center">
                                No hay usuarios registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
