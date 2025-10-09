'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function ProductosPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null)
  const [formularioEdicion, setFormularioEdicion] = useState({
    'Nombre': '',
    Tipo: '',
    Descripcion: ''
  })

  useEffect(() => {
    cargarProductos()
  }, [])

  // Aplicar búsqueda cuando cambien los datos o la búsqueda
  useEffect(() => {
    let filtrados = [...productos]

    // Aplicar búsqueda
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase().trim()
      filtrados = filtrados.filter(producto => {
        const nombreProducto = (producto['Nombre-producto'] || '').toLowerCase()
        const tipo = (producto.Tipo || '').toLowerCase()
        const descripcion = (producto.Descripcion || '').toLowerCase()
        return nombreProducto.includes(terminoBusqueda) || 
               tipo.includes(terminoBusqueda) || 
               descripcion.includes(terminoBusqueda)
      })
    }

    setProductosFiltrados(filtrados)
  }, [productos, busqueda])

  const cargarProductos = async (intentos = 3) => {
    try {
      setLoading(true)
      console.log('Cargando productos...')
      console.log('DATABASE_ID:', DATABASE_ID)
      console.log('APLICACIONES_COLLECTION_ID:', APLICACIONES_COLLECTION_ID)

      // Validar variables de entorno
      if (!DATABASE_ID || !APLICACIONES_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }

      // Validar conexión
      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        APLICACIONES_COLLECTION_ID
      )

      console.log('Respuesta recibida:', response)
      setProductos(response.documents as Producto[])

    } catch (err) {
      console.error('Error completo al cargar productos:', err)

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
        setTimeout(() => cargarProductos(intentos - 1), 2000)
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
  const obtenerFecha = (producto: Producto) => {
    return producto.$createdAt || producto.createdAt || producto.$created_at
  }


  // Función para eliminar un producto
  const eliminarProducto = async () => {
    if (!productoAEliminar) return

    try {
      setEliminandoId(productoAEliminar.$id)
      
      // Validar variables de entorno
      if (!DATABASE_ID || !APLICACIONES_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }

      // Validar conexión
      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }

      await databases.deleteDocument(
        DATABASE_ID,
        APLICACIONES_COLLECTION_ID,
        productoAEliminar.$id
      )

      // Actualizar la lista localmente
      setProductos(productos.filter(p => p.$id !== productoAEliminar.$id))
      
      // Mostrar mensaje de éxito
      setMensajeExito(`Producto "${productoAEliminar['Nombre'] || 'Sin nombre'}" eliminado exitosamente`)
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMensajeExito(null), 3000)

    } catch (err) {
      console.error('Error al eliminar producto:', err)
      let errorMessage = 'Error al eliminar el producto'
      
      if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setEliminandoId(null)
      setProductoAEliminar(null)
    }
  }

  // Función para confirmar eliminación
  const confirmarEliminacion = (producto: Producto) => {
    setProductoAEliminar(producto)
  }

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setProductoAEliminar(null)
  }

  // Función para abrir modal de edición
  const abrirEdicion = (producto: Producto) => {
    setProductoAEditar(producto)
    setFormularioEdicion({
      'Nombre': producto['Nombre'] || '',
      Tipo: producto.Tipo || '',
      Descripcion: producto.Descripcion || ''
    })
  }

  // Función para cerrar modal de edición
  const cerrarEdicion = () => {
    setProductoAEditar(null)
    setFormularioEdicion({
      'Nombre': '',
      Tipo: '',
      Descripcion: ''
    })
  }

  // Función para actualizar un producto
  const actualizarProducto = async () => {
    if (!productoAEditar) return

    try {
      setEditandoId(productoAEditar.$id)
      
      // Validar variables de entorno
      if (!DATABASE_ID || !APLICACIONES_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }

      // Validar conexión
      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }

      // Validar campos requeridos
      if (!formularioEdicion['Nombre'].trim()) {
        throw new Error('El nombre del producto es requerido')
      }

      await databases.updateDocument(
        DATABASE_ID,
        APLICACIONES_COLLECTION_ID,
        productoAEditar.$id,
        {
          'Nombre': formularioEdicion['Nombre'].trim(),
          Tipo: formularioEdicion.Tipo.trim(),
          Descripcion: formularioEdicion.Descripcion.trim()
        }
      )

      // Actualizar la lista localmente
      setProductos(productos.map(p =>
        p.$id === productoAEditar.$id
          ? {
              ...p,
              'Nombre': formularioEdicion['Nombre'].trim(),
              Tipo: formularioEdicion.Tipo.trim(),
              Descripcion: formularioEdicion.Descripcion.trim()
            }
          : p
      ))
      
      // Mostrar mensaje de éxito
      setMensajeExito(`Producto "${formularioEdicion['Nombre']}" actualizado exitosamente`)
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMensajeExito(null), 3000)
      
      // Cerrar modal
      cerrarEdicion()

    } catch (err) {
      console.error('Error al actualizar producto:', err)
      let errorMessage = 'Error al actualizar el producto'
      
      if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setEditandoId(null)
    }
  }

  // Manejar cambio en los campos del formulario
  const manejarCambioFormulario = (campo: string, valor: string | number) => {
    setFormularioEdicion(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-2 sm:p-4">
      {/* Modal de confirmación de eliminación */}
      {productoAEliminar && (
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
                    ¿Estás seguro de que quieres eliminar el producto <strong>"{productoAEliminar['Nombre'] || 'Sin nombre'}"</strong>?
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
                onClick={eliminarProducto}
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

     {/* Modal de edición de producto */}
     {productoAEditar && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center">
               <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                 <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
               </div>
               <div className="ml-4">
                 <h3 className="text-lg font-bold text-gray-900">Editar Producto</h3>
                 <p className="text-sm text-gray-500">Actualiza la información del producto</p>
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
               <label htmlFor="nombre-producto" className="block text-sm font-medium text-gray-700 mb-1">
                 Nombre del Producto *
               </label>
               <input
                 type="text"
                 id="nombre-producto"
                 value={formularioEdicion['Nombre']}
                 onChange={(e) => manejarCambioFormulario('Nombre', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                 placeholder="Ingresa el nombre del producto"
                 disabled={editandoId !== null}
               />
             </div>
             
             <div>
               <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                 Tipo de Producto
               </label>
               <input
                 type="text"
                 id="tipo"
                 value={formularioEdicion.Tipo}
                 onChange={(e) => manejarCambioFormulario('Tipo', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                 placeholder="Ej: Medicamento, Alimento, Suplemento"
                 disabled={editandoId !== null}
               />
             </div>

             <div>
               <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                 Descripción
               </label>
               <textarea
                 id="descripcion"
                 value={formularioEdicion.Descripcion}
                 onChange={(e) => manejarCambioFormulario('Descripcion', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white resize-none"
                 placeholder="Descripción del producto"
                 rows={3}
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
               onClick={actualizarProducto}
               disabled={editandoId !== null || !formularioEdicion['Nombre'].trim()}
               className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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

        {/* Título Principal con animación */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Gestión de Productos
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-3 text-sm sm:text-base">
            Control de productos y servicios relacionados con el ganado
          </p>
        </div>

        {/* Contador de productos con diseño moderno */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-full px-6 py-3 shadow-lg border border-orange-100">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🥛</span>
              <span className="font-semibold text-gray-700">
                {productosFiltrados.length} {productosFiltrados.length === 1 ? 'Producto' : 'Productos'}
              </span>
            </div>
          </div>
        </div>

        {/* Botón Agregar Nuevo Producto */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => router.push('/productos/nuevo')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Registrar Nuevo Producto</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Buscar productos por nombre, tipo o descripción..."
            />
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando productos...</p>
          </div>
        )}

        {/* Mensaje de error */}
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
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

        {/* Lista de productos */}
        {!loading && !error && (
          <div className="space-y-4">
            {productosFiltrados.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {busqueda ? 'No se encontraron productos' : 'No hay productos registrados'}
                </h3>
                <p className="text-gray-500">
                  {busqueda ? 'Intenta con otros términos de búsqueda' : 'Comienza registrando tu primer producto'}
                </p>
              </div>
            ) : (
              productosFiltrados.map((producto: Producto) => (
                <div
                  key={producto.$id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-3xl mr-3">🥛</span>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {producto['Nombre'] || 'Sin nombre'}
                            </h3>
                            {producto.Tipo && (
                              <span className="inline-block bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                                {producto.Tipo}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {producto.Descripcion && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {producto.Descripcion}
                          </p>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatearFecha(obtenerFecha(producto))}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mt-4 sm:mt-0">
                        <button
                          onClick={() => abrirEdicion(producto)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => confirmarEliminacion(producto)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}