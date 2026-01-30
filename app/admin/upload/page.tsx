'use client'

import { useState, useRef } from 'react'

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setMessage(null)
        }
    }

    const handleUpload = async () => {
        if (!file) {
            setMessage({ type: 'error', text: 'Por favor selecciona un archivo primero' })
            return
        }

        setUploading(true)
        setMessage(null)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("http://127.0.0.1:8000/upload", {
                method: "POST",
                body: formData
            })

            if (response.ok) {
                setMessage({ type: 'success', text: `Archivo "${file.name}" subido exitosamente` })
                setFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            } else {
                const errorText = await response.text()
                setMessage({ type: 'error', text: `Error al subir archivo: ${errorText || response.statusText}` })
            }
        } catch (error) {
            setMessage({ type: 'error', text: `Error de conexión: ${error instanceof Error ? error.message : 'No se pudo conectar al servidor'}` })
        } finally {
            setUploading(false)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
            setMessage(null)
        }
    }

    return (
        <div className="dashboard-card">
            <h2 className="card-title">📤 SECCIÓN PARA SUBIR ARCHIVOS</h2>

            <div
                className="upload-dropzone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <div className="upload-icon">📁</div>
                <p className="upload-text">
                    {file ? file.name : 'Arrastra un archivo aquí o haz clic para seleccionar'}
                </p>
                {file && (
                    <p className="upload-file-info">
                        Tamaño: {(file.size / 1024).toFixed(2)} KB
                    </p>
                )}
            </div>

            <button
                className="btn btn-primary upload-btn"
                onClick={handleUpload}
                disabled={!file || uploading}
            >
                {uploading ? 'Subiendo...' : 'Subir Archivo'}
            </button>

            {message && (
                <div className={`upload-message ${message.type}`}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}
        </div>
    )
}
