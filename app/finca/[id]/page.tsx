'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { databases, DATABASE_ID, FINCA_COLLECTION_ID } from '@/lib/appwrite'

interface Finca {
  $id: string
  $createdAt?: string
  createdAt?: string
  $created_at?: string
  'Nombre-finca'?: string
  Nombre_apartado?: string
  [key: string]: any
}

export default function DetalleFincaPage() {
  const router = useRouter()
  const params = useParams()
  const [finca, setFinca] = useState<Finca | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      cargarFinca(params.id as string)
    }
  }, [params.id])

  const cargarFinca = async (id: string, intentos = 3) => {
    try {
      setLoading(true)
      console.log('Cargando finca con ID:', id)

      if (!DATABASE_ID || !FINCA_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }

      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }

      const response = await databases.getDocument(
        DATABASE_ID,
        FINCA_COLLECTION_ID,
        id
      )

      console.log('Finca cargada:', response)
      setFinca(response as Finca)
    } catch (err) {
      console.error('Error completo al cargar finca:', err)

      let errorMessage = 'Error al cargar la finca'
      if (err instanceof Error) {
        errorMessage = err.message
        
        if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet y que el servidor esté disponible.'
        } else if (err.name === 'AbortError') {
          errorMessage = 'La conexión tardó demasiado tiempo. Intentando nuevamente...'
        } else if (err.message.includes('CORS')) {
          errorMessage = 'Error de CORS. Verifica la configuración del servidor.'
        }
      }

      if (intentos > 1) {
        console.log(`Reintentando... (${intentos - 1} intentos restantes)`)
        setTimeout(() => cargarFinca(id, intentos - 1), 2000)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'No disponible'
    return new Date(fecha).toLocaleDateString('es-ES')
  }

  // Función para obtener la fecha correcta (maneja $createdAt o createdAt)
  const obtenerFecha = (finca: Finca) => {
    return finca.$createdAt || finca.createdAt || finca.$created_at
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200"></div>
              <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !finca) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6 shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-red-700 font-medium">{error || 'No se encontró la finca'}</p>
              </div>
              <button
                onClick={() => router.back()}
                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Botón Volver */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="group flex items-center text-gray-700 hover:text-cyan-600 transition-all duration-300 transform hover:scale-105"
          >
            <div className="mr-2 p-2 rounded-full bg-white shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="font-medium">Volver a la lista</span>
          </button>
        </div>

        {/* Título Principal */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Detalle de Finca
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-3 text-sm sm:text-base">
              Información completa de la finca {finca['Nombre-finca'] || 'Sin nombre'}
            </p>
          </div>
        </div>

        {/* Tarjeta de Detalles */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Encabezado con gradiente */}
          <div className="relative overflow-hidden p-6 bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
            {/* Patrón de fondo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-2 text-4xl transform rotate-12">
                🏡
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {finca['Nombre-finca'] || 'Sin nombre'}
                  </h2>
                  <p className="text-white/80 text-lg truncate">
                    {finca.Nombre_apartado || 'Sin apartado'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información general */}
              <div className="bg-cyan-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-cyan-700 mb-4 flex items-center">
                  <span className="mr-2">📋</span>
                  Información General
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Nombre de la finca:</span>
                    <span className="text-gray-900 font-semibold">
                      {finca['Nombre-finca'] || 'No registrado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Nombre del apartado:</span>
                    <span className="text-gray-900 font-semibold">
                      {finca.Nombre_apartado || 'No registrado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información de registro */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
                  <span className="mr-2">📅</span>
                  Información de Registro
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Fecha de registro:</span>
                    <span className="text-gray-900 font-semibold">
                      {formatearFecha(obtenerFecha(finca))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">ID del registro:</span>
                    <span className="text-gray-900 font-semibold truncate">
                      {finca.$id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    Información de la finca
                  </span>
                  <div className="w-3 h-3 rounded-full bg-cyan-500 ml-2"></div>
                </div>
                <div className="text-sm text-gray-500 text-center max-w-md">
                  <p>
                    Finca registrada con los campos: ID, Nombre de finca, Nombre del apartado y Fecha de creación
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}