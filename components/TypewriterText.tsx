'use client'

import { useState, useEffect, useRef } from 'react'

interface TypewriterTextProps {
    text: string
    speed?: number
    className?: string
    onComplete?: () => void
}

export default function TypewriterText({
    text,
    speed = 80,
    className = '',
    onComplete
}: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState('')
    const currentIndexRef = useRef(0)
    const previousTextRef = useRef(text)

    useEffect(() => {
        // Reset if text changed
        if (previousTextRef.current !== text) {
            setDisplayedText('')
            currentIndexRef.current = 0
            previousTextRef.current = text
        }

        if (currentIndexRef.current < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(text.slice(0, currentIndexRef.current + 1))
                currentIndexRef.current += 1
            }, speed)

            return () => clearTimeout(timeout)
        } else if (currentIndexRef.current === text.length && onComplete) {
            onComplete()
        }
    }, [displayedText, text, speed, onComplete])

    const showCursor = displayedText.length < text.length

    return (
        <span className={className}>
            {displayedText}
            {showCursor && <span className="typewriter-cursor">|</span>}
        </span>
    )
}
