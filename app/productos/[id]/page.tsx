'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { databases, DATABASE_ID, APLICACIONES_COLLECTION_ID } from '@/lib/appwrite'

interface Producto {
  $id: string
  'Nombre'?: string
  Tipo?: string
  Descripcion?: string
  $createdAt?: string
  createdAt?: string
  [key: string]: any
}

export default function ProductoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [producto, setProducto] = useState<Producto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      cargarProducto()
    }
  }, [id])

  const cargarProducto = async (intentos = 3) => {
    try {
      setCargando(true)
      setError(null)

      // Validar variables de entorno
      if (!DATABASE_ID || !APLICACIONES_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }

      // Validar conexión
      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }

      const productoData = await databases.getDocument(
        DATABASE_ID,
        APLICACIONES_COLLECTION_ID,
        id
      )

      setProducto(productoData as Producto)

    } catch (err) {
      console.error('Error al cargar producto:', err)

      let errorMessage = 'Error al cargar los datos del producto'
      if (err instanceof Error) {
        errorMessage = err.message

        // Manejo específico de errores comunes
        if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet y que el servidor esté disponible.'
        } else if (err.message.includes('Document with the requested ID could not be found')) {
          errorMessage = 'El producto no fue encontrado.'
        }
      }

      // Reintentar si hay intentos disponibles
      if (intentos > 1) {
        console.log(`Reintentando... (${intentos - 1} intentos restantes)`)
        setTimeout(() => cargarProducto(intentos - 1), 2000)
      } else {
        setError(errorMessage)
      }
    } finally {
      setCargando(false)
    }
  }

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'No disponible'
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }


  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del producto...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="group flex items-center text-gray-700 hover:text-orange-600 transition-all duration-300 transform hover:scale-105"
            >
              <div className="mr-2 p-2 rounded-full bg-white shadow-md group-hover:shadow-lg transition-shadow">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="font-medium">Volver</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/productos')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Volver a Productos
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
            <p className="text-gray-600 mb-6">El producto que buscas no existe o fue eliminado.</p>
            <button
              onClick={() => router.push('/productos')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Volver a Productos
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Botón Volver */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="group flex items-center text-gray-700 hover:text-orange-600 transition-all duration-300 transform hover:scale-105"
          >
            <div className="mr-2 p-2 rounded-full bg-white shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="font-medium">Volver</span>
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-3xl text-white mr-4">
                🥛
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {producto['Nombre'] || 'Sin nombre'}
                </h1>
                {producto.Tipo && (
                  <span className="inline-block bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full mt-2">
                    {producto.Tipo}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/productos`)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Editar</span>
              </button>
              <button
                onClick={() => router.push('/productos')}
                className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Lista</span>
              </button>
            </div>
          </div>
        </div>

        {/* Información del Producto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripción */}
            {producto.Descripcion && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Descripción
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {producto.Descripcion}
                </p>
              </div>
            )}

            {/* Detalles Adicionales */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Información del Producto
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-gray-900 font-mono text-sm">{producto.$id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Registro</label>
                  <p className="text-gray-900">{formatearFecha(producto.$createdAt || producto.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="space-y-6">
          </div>
        </div>
      </div>
    </div>
  )
}