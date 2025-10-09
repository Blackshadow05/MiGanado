'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { databases, DATABASE_ID, FINCA_COLLECTION_ID } from '@/lib/appwrite'

interface Finca {
  $id: string
  'Nombre-finca'?: string
  Nombre_apartado?: string
  $createdAt?: string
  createdAt?: string // Alias para manejar el formato de Appwrite
  [key: string]: any
}

export default function FincaPage() {
  const router = useRouter()
  const [fincas, setFincas] = useState<Finca[]>([])
  const [fincasFiltradas, setFincasFiltradas] = useState<Finca[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [fincaAEliminar, setFincaAEliminar] = useState<Finca | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [fincaAEditar, setFincaAEditar] = useState<Finca | null>(null)
  const [formularioEdicion, setFormularioEdicion] = useState({
    'Nombre-finca': '',
    Nombre_apartado: ''
  })

  useEffect(() => {
    cargarFincas()
  }, [])

  // Aplicar búsqueda cuando cambien los datos o la búsqueda
  useEffect(() => {
    let filtradas = [...fincas]

    // Aplicar búsqueda
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase().trim()
      filtradas = filtradas.filter(finca => {
        const nombreFinca = (finca['Nombre-finca'] || '').toLowerCase()
        const nombreApartado = (finca.Nombre_apartado || '').toLowerCase()
        return nombreFinca.includes(terminoBusqueda) || nombreApartado.includes(terminoBusqueda)
      })
    }

    setFincasFiltradas(filtradas)
  }, [fincas, busqueda])

  const cargarFincas = async (intentos = 3) => {
    try {
      setLoading(true)
      console.log('Cargando fincas...')
      console.log('DATABASE_ID:', DATABASE_ID)
      console.log('FINCA_COLLECTION_ID:', FINCA_COLLECTION_ID)

      // Validar variables de entorno
      if (!DATABASE_ID || !FINCA_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }

      // Validar conexión
      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        FINCA_COLLECTION_ID
      )

      console.log('Respuesta recibida:', response)
      setFincas(response.documents as Finca[])

    } catch (err) {
      console.error('Error completo al cargar fincas:', err)

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
        setTimeout(() => cargarFincas(intentos - 1), 2000)
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

  // Función para eliminar una finca
  const eliminarFinca = async () => {
    if (!fincaAEliminar) return

    try {
      setEliminandoId(fincaAEliminar.$id)
      
      // Validar variables de entorno
      if (!DATABASE_ID || !FINCA_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }

      // Validar conexión
      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }

      await databases.deleteDocument(
        DATABASE_ID,
        FINCA_COLLECTION_ID,
        fincaAEliminar.$id
      )

      // Actualizar la lista localmente
      setFincas(fincas.filter(f => f.$id !== fincaAEliminar.$id))
      
      // Mostrar mensaje de éxito
      setMensajeExito(`Finca "${fincaAEliminar['Nombre-finca'] || 'Sin nombre'}" eliminada exitosamente`)
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMensajeExito(null), 3000)

    } catch (err) {
      console.error('Error al eliminar finca:', err)
      let errorMessage = 'Error al eliminar la finca'
      
      if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setEliminandoId(null)
      setFincaAEliminar(null)
    }
  }

  // Función para confirmar eliminación
  const confirmarEliminacion = (finca: Finca) => {
    setFincaAEliminar(finca)
  }

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setFincaAEliminar(null)
  }

  // Función para abrir modal de edición
  const abrirEdicion = (finca: Finca) => {
    setFincaAEditar(finca)
    setFormularioEdicion({
      'Nombre-finca': finca['Nombre-finca'] || '',
      Nombre_apartado: finca.Nombre_apartado || ''
    })
  }

  // Función para cerrar modal de edición
  const cerrarEdicion = () => {
    setFincaAEditar(null)
    setFormularioEdicion({
      'Nombre-finca': '',
      Nombre_apartado: ''
    })
  }

  // Función para actualizar una finca
  const actualizarFinca = async () => {
    if (!fincaAEditar) return

    try {
      setEditandoId(fincaAEditar.$id)
      
      // Validar variables de entorno
      if (!DATABASE_ID || !FINCA_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }

      // Validar conexión
      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }

      // Validar campos requeridos
      if (!formularioEdicion['Nombre-finca'].trim()) {
        throw new Error('El nombre de la finca es requerido')
      }

      await databases.updateDocument(
        DATABASE_ID,
        FINCA_COLLECTION_ID,
        fincaAEditar.$id,
        {
          'Nombre-finca': formularioEdicion['Nombre-finca'].trim(),
          Nombre_apartado: formularioEdicion.Nombre_apartado.trim()
        }
      )

      // Actualizar la lista localmente
      setFincas(fincas.map(f =>
        f.$id === fincaAEditar.$id
          ? {
              ...f,
              'Nombre-finca': formularioEdicion['Nombre-finca'].trim(),
              Nombre_apartado: formularioEdicion.Nombre_apartado.trim()
            }
          : f
      ))
      
      // Mostrar mensaje de éxito
      setMensajeExito(`Finca "${formularioEdicion['Nombre-finca']}" actualizada exitosamente`)
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMensajeExito(null), 3000)
      
      // Cerrar modal
      cerrarEdicion()

    } catch (err) {
      console.error('Error al actualizar finca:', err)
      let errorMessage = 'Error al actualizar la finca'
      
      if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setEditandoId(null)
    }
  }

  // Manejar cambio en los campos del formulario
  const manejarCambioFormulario = (campo: string, valor: string) => {
    setFormularioEdicion(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-2 sm:p-4">
      {/* Modal de confirmación de eliminación */}
      {fincaAEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">Confirmar eliminación</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    ¿Estás seguro de que quieres eliminar la finca <strong>"{fincaAEliminar['Nombre-finca'] || 'Sin nombre'}"</strong>?
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelarEliminacion}
                disabled={eliminandoId !== null}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarFinca}
                disabled={eliminandoId !== null}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {eliminandoId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de éxito */}
      {mensajeExito && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-lg max-w-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{mensajeExito}</p>
              </div>
            </div>
          </div>
        </div>
      )}

     {/* Modal de edición de finca */}
     {fincaAEditar && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center">
               <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                 <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
               </div>
               <div className="ml-4">
                 <h3 className="text-lg font-bold text-gray-900">Editar Finca</h3>
                 <p className="text-sm text-gray-500">Actualiza la información de la finca</p>
               </div>
             </div>
             <button
               onClick={cerrarEdicion}
               disabled={editandoId !== null}
               className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           
           <div className="space-y-4">
             <div>
               <label htmlFor="nombre-finca" className="block text-sm font-medium text-gray-700 mb-1">
                 Nombre de la Finca *
               </label>
               <input
                 type="text"
                 id="nombre-finca"
                 value={formularioEdicion['Nombre-finca']}
                 onChange={(e) => manejarCambioFormulario('Nombre-finca', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-gray-900 bg-white"
                 placeholder="Ingresa el nombre de la finca"
                 disabled={editandoId !== null}
               />
             </div>
             
             <div>
               <label htmlFor="nombre-apartado" className="block text-sm font-medium text-gray-700 mb-1">
                 Nombre del Apartado
               </label>
               <input
                 type="text"
                 id="nombre-apartado"
                 value={formularioEdicion.Nombre_apartado}
                 onChange={(e) => manejarCambioFormulario('Nombre_apartado', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-gray-900 bg-white"
                 placeholder="Ingresa el nombre del apartado (opcional)"
                 disabled={editandoId !== null}
               />
             </div>
           </div>

           <div className="flex justify-end space-x-3 mt-6">
             <button
               onClick={cerrarEdicion}
               disabled={editandoId !== null}
               className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
             >
               Cancelar
             </button>
             <button
               onClick={actualizarFinca}
               disabled={editandoId !== null || !formularioEdicion['Nombre-finca'].trim()}
               className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
             >
               {editandoId ? (
                 <>
                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                   <span>Actualizando...</span>
                 </>
               ) : (
                 <>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                   <span>Actualizar</span>
                 </>
               )}
             </button>
           </div>
         </div>
       </div>
     )}
      {/* Header Moderno */}
      <div className="max-w-4xl mx-auto">
        {/* Botón Volver con diseño mejorado */}
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
            <span className="font-medium">Volver</span>
          </button>
        </div>

        {/* Título Principal con animación */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Gestión de Fincas
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-3 text-sm sm:text-base">
            Control de propiedades y terrenos de tu operación ganadera
          </p>
        </div>

        {/* Contador de fincas con diseño moderno */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-full px-6 py-3 shadow-lg border border-cyan-100">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏡</span>
              <span className="font-semibold text-gray-700">
                {fincasFiltradas.length} {fincasFiltradas.length === 1 ? 'Finca' : 'Fincas'}
              </span>
            </div>
          </div>
        </div>

        {/* Botón Agregar Nueva Finca */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => router.push('/finca/nuevo')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Registrar Nueva Finca</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Buscador */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre de finca o apartado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Loading State con diseño mejorado */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200"></div>
              <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
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
                onClick={() => cargarFincas()}
                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Fincas Grid con diseño móvil-first */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {fincasFiltradas.map((finca) => (
              <div
                key={finca.$id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                {/* Efecto de brillo superior */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-400"></div>

                {/* Header con gradiente */}
                <div className="relative overflow-hidden p-6 bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
                  {/* Patrón de fondo animado */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-2 text-4xl transform rotate-12">
                      🏡
                    </div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                          {finca['Nombre-finca'] || 'Sin nombre'}
                        </h3>
                        <p className="text-white/80 text-sm sm:text-base truncate">
                          {finca.Nombre_apartado || 'Sin apartado'}
                        </p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirEdicion(finca)
                          }}
                          disabled={eliminandoId !== null || editandoId !== null}
                          className="flex-shrink-0 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                          title="Editar finca"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            confirmarEliminacion(finca)
                          }}
                          disabled={eliminandoId !== null || editandoId !== null}
                          className="flex-shrink-0 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                          title="Eliminar finca"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido principal */}
                <div className="p-4 sm:p-6">
                  {/* Información adicional */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">📅</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha de registro</p>
                        <p className="font-semibold text-gray-800">
                          {formatearFecha(obtenerFecha(finca))}
                        </p>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Hover effect - brillo inferior */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State con diseño mejorado */}
        {!loading && !error && fincasFiltradas.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
              <div className="text-6xl">🏡</div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No hay fincas registradas
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Comienza agregando tu primera finca al sistema para gestionar tus propiedades y terrenos
            </p>
            <div className="mt-6">
              <button
                onClick={() => cargarFincas()}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
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