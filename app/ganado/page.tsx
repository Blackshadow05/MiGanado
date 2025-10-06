'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { databases, DATABASE_ID, GANADO_COLLECTION_ID } from '@/lib/appwrite'

interface Animal {
  $id: string
  id_animal?: string
  peso_entrada?: number
  precio_kg?: number
  fecha_compra?: string
  Precio_compra?: number
  farm_nombre?: string
  farm_id?: string
  precio_kg_venta?: number
  peso_salida?: number
  Precio_venta?: number
  Imagen?: string
  fecha_venta?: string
  [key: string]: any
}

export default function GanadoPage() {
  const router = useRouter()
  const [animales, setAnimales] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarAnimales()
  }, [])

  const cargarAnimales = async (intentos = 3) => {
    let timeoutId: NodeJS.Timeout | null = null
    try {
      setLoading(true)
      console.log('Cargando animales...')
      console.log('DATABASE_ID:', DATABASE_ID)
      console.log('GANADO_COLLECTION_ID:', GANADO_COLLECTION_ID)
      
      // Validar variables de entorno
      if (!DATABASE_ID || !GANADO_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }
      
      // Validar conexión
      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        GANADO_COLLECTION_ID
      )
      
      console.log('Respuesta recibida:', response)
      setAnimales(response.documents as Animal[])
      
    } catch (err) {
      console.error('Error completo al cargar animales:', err)
      
      let errorMessage = 'Error al cargar los datos'
      if (err instanceof Error) {
        errorMessage = err.message
        console.error('Stack trace:', err.stack)
        
        // Manejo específico de errores comunes
        if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet y que el servidor esté disponible.'
        } else if (err.name === 'AbortError') {
          errorMessage = 'La conexión tardó demasiado tiempo. Intentando nuevamente...'
        } else if (err.message.includes('CORS')) {
          errorMessage = 'Error de CORS. Verifica la configuración del servidor.'
        }
      }
      
      // Reintentar si hay intentos disponibles
      if (intentos > 1) {
        console.log(`Reintentando... (${intentos - 1} intentos restantes)`)
        setTimeout(() => cargarAnimales(intentos - 1), 2000)
      } else {
        setError(errorMessage)
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'No disponible'
    return new Date(fecha).toLocaleDateString('es-ES')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-2 sm:p-4">
      {/* Header Moderno */}
      <div className="max-w-4xl mx-auto">
        {/* Botón Volver con diseño mejorado */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="group flex items-center text-gray-700 hover:text-emerald-600 transition-all duration-300 transform hover:scale-105"
          >
            <div className="mr-2 p-2 rounded-full bg-white shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="font-medium">Volver</span>
          </button>
        </div>

        {/* Título Principal con animación */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Gestión de Ganado
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-3 text-sm sm:text-base">
            Control total de tu inventario ganadero
          </p>
        </div>

        {/* Contador de animales con diseño moderno */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-full px-6 py-3 shadow-lg border border-emerald-100">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🐄</span>
              <span className="font-semibold text-gray-700">
                {animales.length} {animales.length === 1 ? 'Animal' : 'Animales'}
              </span>
            </div>
          </div>
        </div>

        {/* Loading State con diseño mejorado */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200"></div>
              <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
          </div>
        )}

        {/* Error State con diseño moderno */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6 shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
              <button
                onClick={() => cargarAnimales()}
                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Animales Grid con diseño móvil-first */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {animales.map((animal) => (
              <div
                key={animal.$id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                {/* Efecto de brillo superior */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                
                {/* Header con gradiente dinámico */}
                <div className={`
                  relative overflow-hidden p-6 bg-gradient-to-br 
                  ${animal.fecha_venta 
                    ? 'from-red-400 to-red-600' 
                    : 'from-emerald-400 to-teal-600'
                  } text-white
                `}>
                  {/* Patrón de fondo animado */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-2 text-4xl transform rotate-12">
                      🐄
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                          ID: {animal.id_animal || 'N/A'}
                        </h3>
                        <p className="text-white/90 text-sm sm:text-base truncate">
                          {animal.farm_nombre || 'Sin finca'}
                        </p>
                      </div>
                      <div className="ml-2">
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-bold
                          ${animal.fecha_venta 
                            ? 'bg-red-600 text-white' 
                            : 'bg-green-600 text-white'
                          }
                        `}>
                          {animal.fecha_venta ? 'Vendido' : 'Disponible'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido principal */}
                <div className="p-4 sm:p-6">
                  {/* Información principal con iconos */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 text-sm font-bold">#</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">ID Animal</p>
                        <p className="font-semibold text-gray-800">{animal.id_animal || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">🏡</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Finca</p>
                        <p className="font-semibold text-gray-800 truncate">{animal.farm_nombre || 'Sin finca'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">📊</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Estado</p>
                        <p className={`font-semibold ${
                          animal.fecha_venta ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {animal.fecha_venta ? 'Vendido' : 'Disponible'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicador visual de estado */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estado actual</span>
                      <div className={`w-3 h-3 rounded-full ${
                        animal.fecha_venta ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                    </div>
                  </div>
                </div>

                {/* Hover effect - brillo inferior */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State con diseño mejorado */}
        {!loading && !error && animales.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
              <div className="text-6xl">🐄</div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No hay animales registrados
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Comienza agregando tu primer animal al sistema para gestionar tu inventario ganadero
            </p>
            <div className="mt-6">
              <button
                onClick={() => cargarAnimales()}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Actualizar lista
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}