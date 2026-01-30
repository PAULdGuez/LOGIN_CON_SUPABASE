'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UploadedFile } from '@/lib/types'
import ToggleSwitch from '@/components/ToggleSwitch'

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [loadingFiles, setLoadingFiles] = useState(true)
    const [listView, setListView] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const supabase = useMemo(() => createClient(), [])

    const fetchFiles = useCallback(async (currentUserId: string) => {
        setLoadingFiles(true)
        try {
            // Ensure no caching to prevent data leaks or stale data
            const response = await fetch(`http://127.0.0.1:8000/files/${currentUserId}`, { cache: 'no-store' })
            if (response.ok) {
                const data = await response.json()
                setFiles(data)
            }
        } catch (error) {
            console.error('Error fetching files:', error)
        } finally {
            setLoadingFiles(false)
        }
    }, [])

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                fetchFiles(user.id)
            }
        }
        getUser()
    }, [supabase, fetchFiles, refreshTrigger])

    // WebSocket connection
    useEffect(() => {
        let ws: WebSocket | null = null;
        let retryTimeout: NodeJS.Timeout;

        const connect = () => {
            ws = new WebSocket('ws://127.0.0.1:8000/ws');

            ws.onopen = () => {
                console.log('Connected to WebSocket');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'new_file') {
                        setRefreshTrigger(prev => prev + 1);
                    }
                } catch (e) {
                    console.error('Error parsing WS message', e);
                }
            };

            ws.onclose = () => {
                // Retry silently to avoid console spam if backend is down
                retryTimeout = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                // Suppress verbose error logging for connection refused (common in dev state)
                console.warn('WebSocket connection error. Is the backend running?');
                ws?.close();
            }
        };

        connect();

        return () => {
            if (ws) {
                ws.onclose = null; // Prevent retry on unmount
                ws.close();
            }
            clearTimeout(retryTimeout);
        }
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setMessage(null)
        }
    }

    const handleUpload = async () => {
        if (!file || !userId) {
            setMessage({ type: 'error', text: 'Por favor selecciona un archivo primero' })
            return
        }

        setUploading(true)
        setMessage(null)

        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("user_id", userId)

            const response = await fetch("http://127.0.0.1:8000/upload", {
                method: "POST",
                body: formData
            })

            if (response.ok) {
                await response.json()
                setMessage({ type: 'success', text: `Archivo "${file.name}" subido exitosamente` })
                setFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
                // Refresh list
                fetchFiles(userId)
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
                disabled={!file || uploading || !userId}
            >
                {uploading ? 'Subiendo...' : 'Subir Archivo'}
            </button>

            {message && (
                <div className={`upload-message ${message.type}`}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 className="text-lg font-semibold">Mis Archivos</h3>
                    <ToggleSwitch
                        isActive={listView}
                        onToggle={() => setListView(!listView)}
                        label={listView ? "Vista de Lista" : "Vista de Cuadrícula"}
                    />
                </div>

                {loadingFiles ? (
                    <p className="text-center text-gray-500">Cargando archivos...</p>
                ) : files.length === 0 ? (
                    <p className="text-center text-gray-500">No hay archivos subidos</p>
                ) : (
                    <div style={listView ? { display: 'flex', flexDirection: 'column', gap: '0.5rem' } : { display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {files.map((f, index) => (
                            <div
                                key={index}
                                className="border rounded-lg hover:shadow-md transition-shadow"
                                style={listView ? {
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 1rem',
                                    height: '30px',
                                    width: '100%',
                                    gap: '1rem'
                                } : {
                                    width: '150px',
                                    padding: '0.5rem'
                                }}
                            >
                                {!listView && (
                                    <div
                                        className="bg-gray-100 rounded-md mb-2 overflow-hidden flex items-center justify-center"
                                        style={{ width: '100%', height: '110px' }}
                                    >
                                        {f.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={f.url}
                                                alt={f.filename}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <span className="text-4xl">📄</span>
                                        )}
                                    </div>
                                )}

                                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {listView && (
                                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>
                                            {f.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? '🖼️' : '📄'}
                                        </span>
                                    )}
                                    <p className="text-xs truncate font-medium" style={{ margin: 0 }} title={f.filename}>{f.filename}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
