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
