'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { databases, DATABASE_ID, APLICACIONES_COLLECTION_ID } from '@/lib/appwrite'

export default function NuevoProductoPage() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formulario, setFormulario] = useState({
    'Nombre': '',
    Tipo: '',
    Descripcion: ''
  })

  const manejarCambio = (campo: string, valor: string | number) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setCargando(true)
      setError(null)

      // Validar campos requeridos
      if (!formulario['Nombre'].trim()) {
        throw new Error('El nombre del producto es requerido')
      }

      // Validar variables de entorno
      if (!DATABASE_ID || !APLICACIONES_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }

      // Validar conexión
      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }

      // Crear el documento en Appwrite
      const nuevoProducto = {
        'Nombre': formulario['Nombre'].trim(),
        Tipo: formulario.Tipo.trim(),
        Descripcion: formulario.Descripcion.trim()
      }

      await databases.createDocument(
        DATABASE_ID,
        APLICACIONES_COLLECTION_ID,
        'unique()', // Appwrite generará un ID único
        nuevoProducto
      )

      // Redirigir a la página de productos con mensaje de éxito
      router.push('/productos?nuevo=registrado')

    } catch (err) {
      console.error('Error al crear producto:', err)
      let errorMessage = 'Error al crear el producto'
      
      if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
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

        {/* Título Principal */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Registrar Nuevo Producto
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-3 text-sm sm:text-base">
            Completa la información del nuevo producto o servicio
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={manejarEnvio} className="space-y-6">
            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Nombre del Producto */}
            <div>
              <label htmlFor="nombre-producto" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="nombre-producto"
                value={formulario['Nombre']}
                onChange={(e) => manejarCambio('Nombre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                placeholder="Ingresa el nombre del producto"
                required
                disabled={cargando}
              />
            </div>

            {/* Tipo de Producto */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Producto
              </label>
              <input
                type="text"
                id="tipo"
                value={formulario.Tipo}
                onChange={(e) => manejarCambio('Tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                placeholder="Ej: Medicamento, Alimento, Suplemento, Equipo"
                disabled={cargando}
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="descripcion"
                value={formulario.Descripcion}
                onChange={(e) => manejarCambio('Descripcion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white resize-none"
                placeholder="Describe el producto, sus características y usos"
                rows={4}
                disabled={cargando}
              />
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={cargando}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando || !formulario['Nombre'].trim()}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {cargando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Registrar Producto</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> Los productos pueden incluir medicamentos, alimentos, suplementos, equipos o cualquier otro insumo necesario para la operación ganadera.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}