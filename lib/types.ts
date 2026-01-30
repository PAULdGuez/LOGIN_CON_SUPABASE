export interface Profile {
    id: string
    name: string
    role: 'user' | 'admin'
    created_at: string
}

export interface User {
    id: string
    email: string
    profile?: Profile
}

export interface SidebarItem {
    label: string
    href: string
    icon?: string
}

export interface AuditLog {
    id: string
    action: 'INSERT' | 'UPDATE' | 'DELETE'
    table_name: string
    record_id: string
    old_data: Record<string, unknown> | null
    new_data: Record<string, unknown> | null
    changed_by: string | null
    changed_by_name: string | null
    changed_at: string
}

export interface UploadedFile {
    user_id: string
    filename: string
    stored_filename: string
    url: string
    user_name?: string
}

