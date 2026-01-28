'use client'

interface ToggleSwitchProps {
    isActive: boolean
    onToggle: () => void
    label?: string
}

export default function ToggleSwitch({ isActive, onToggle, label }: ToggleSwitchProps) {
    return (
        <div className="toggle-container">
            {label && <span className="toggle-label">{label}</span>}
            <button
                type="button"
                className={`toggle-switch ${isActive ? 'active' : ''}`}
                onClick={onToggle}
                aria-pressed={isActive}
            />
        </div>
    )
}
