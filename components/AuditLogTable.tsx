'use client'

import { AuditLog } from '@/lib/types'

interface AuditLogTableProps {
    logs: AuditLog[]
    loading?: boolean
}

export default function AuditLogTable({ logs, loading = false }: AuditLogTableProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'INSERT':
                return 'Creado'
            case 'UPDATE':
                return 'Actualizado'
            case 'DELETE':
                return 'Eliminado'
            default:
                return action
        }
    }

    const getActionClass = (action: string) => {
        switch (action) {
            case 'INSERT':
                return 'badge-insert'
            case 'UPDATE':
                return 'badge-update'
            case 'DELETE':
                return 'badge-delete'
            default:
                return ''
        }
    }

    const getChangedFields = (oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) => {
        if (!oldData || !newData) return null

        const changes: { field: string; from: unknown; to: unknown }[] = []

        for (const key of Object.keys(newData)) {
            if (key === 'id' || key === 'created_at') continue
            if (oldData[key] !== newData[key]) {
                changes.push({
                    field: key,
                    from: oldData[key],
                    to: newData[key]
                })
            }
        }

        return changes.length > 0 ? changes : null
    }

    if (loading) {
        return (
            <div className="audit-log-loading">
                <p>Cargando historial...</p>
            </div>
        )
    }

    if (logs.length === 0) {
        return (
            <div className="audit-log-empty">
                <p>No hay registros de cambios aún.</p>
            </div>
        )
    }

    return (
        <div className="audit-log-container">
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Acción</th>
                            <th>Usuario Afectado</th>
                            <th>Cambios</th>
                            <th>Realizado por</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => {
                            const changes = getChangedFields(log.old_data, log.new_data)
                            const affectedUserName = log.new_data?.name || log.old_data?.name || 'Desconocido'

                            return (
                                <tr key={log.id}>
                                    <td className="audit-date">
                                        {formatDate(log.changed_at)}
                                    </td>
                                    <td>
                                        <span className={`badge ${getActionClass(log.action)}`}>
                                            {getActionLabel(log.action)}
                                        </span>
                                    </td>
                                    <td>{String(affectedUserName)}</td>
                                    <td className="audit-changes">
                                        {log.action === 'INSERT' && (
                                            <span className="change-item">Nuevo usuario creado</span>
                                        )}
                                        {log.action === 'DELETE' && (
                                            <span className="change-item">Usuario eliminado</span>
                                        )}
                                        {log.action === 'UPDATE' && changes && (
                                            <div className="changes-list">
                                                {changes.map((change, idx) => (
                                                    <div key={idx} className="change-item">
                                                        <strong>{change.field}:</strong>{' '}
                                                        <span className="old-value">{String(change.from)}</span>
                                                        {' → '}
                                                        <span className="new-value">{String(change.to)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td>{log.changed_by_name || 'Sistema'}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
