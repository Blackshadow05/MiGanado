'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { databases, DATABASE_ID, FINCA_COLLECTION_ID } from '@/lib/appwrite'
import { ID } from 'appwrite'

interface FormData {
  'Nombre-finca': string
  Nombre_apartado: string
  nombreFinca: string // Para manejar el campo en el formulario
}

export default function NuevaFincaPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    'Nombre-finca': '',
    Nombre_apartado: '',
    nombreFinca: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validar campos requeridos
      if (!formData['Nombre-finca'] || !formData.Nombre_apartado) {
        throw new Error('Por favor complete todos los campos requeridos')
      }

      // Crear el documento en Appwrite
      await databases.createDocument(
        DATABASE_ID,
        FINCA_COLLECTION_ID,
        ID.unique(),
        {
          'Nombre-finca': formData['Nombre-finca'],
          Nombre_apartado: formData.Nombre_apartado
        }
      )

      // Redirigir a la lista de fincas con éxito
      router.push('/finca?nuevo=registrado')
    } catch (err) {
      console.error('Error al registrar finca:', err)
      setError(err instanceof Error ? err.message : 'Error al registrar la finca')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center text-gray-700 hover:text-cyan-600 transition-all duration-300 transform hover:scale-105 mb-6"
          >
            <div className="mr-2 p-2 rounded-full bg-white shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="font-medium">Volver</span>
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Registrar Nueva Finca
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-3">
              Complete los datos de la nueva finca
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre de la Finca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Finca *
              </label>
              <input
                type="text"
                name="Nombre-finca"
                value={formData['Nombre-finca']}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-gray-900 bg-white"
                placeholder="Ej: Finca los Alamos"
                required
              />
            </div>

            {/* Nombre del Apartado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Apartado *
              </label>
              <input
                type="text"
                name="Nombre_apartado"
                value={formData.Nombre_apartado}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-gray-900 bg-white"
                placeholder="Ej: El escondido"
                required
              />
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md flex items-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Registrar Finca</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}