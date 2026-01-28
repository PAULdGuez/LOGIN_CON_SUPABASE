'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SidebarItem } from '@/lib/types'

interface SidebarProps {
    items: SidebarItem[]
    title: string
    userName: string
    userEmail: string
    onLogout: () => void
}

export default function Sidebar({ items, title, userName, userEmail, onLogout }: SidebarProps) {
    const pathname = usePathname()

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-title">{title}</h1>
            </div>

            <nav className="sidebar-nav">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                    >
                        {item.icon && <span>{item.icon}</span>}
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">{getInitials(userName)}</div>
                    <div>
                        <div className="user-name">{userName}</div>
                        <div className="user-email">{userEmail}</div>
                    </div>
                </div>
                <button className="btn" style={{ width: '100%' }} onClick={onLogout}>
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    )
}
