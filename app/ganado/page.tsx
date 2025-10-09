'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { databases, DATABASE_ID, GANADO_COLLECTION_ID, APLICACIONES_COLLECTION_ID, APLICACIONESANIMAL_COLLECTION_ID } from '@/lib/appwrite'
import { Query } from 'appwrite'

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

function GanadoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [animales, setAnimales] = useState<Animal[]>([])
  const [animalesFiltrados, setAnimalesFiltrados] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'Activos' | 'Vendidos' | 'Todos'>('Activos')
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // Clave para forzar re-renderizado
  const [modoSeleccion, setModoSeleccion] = useState(false)
  const [animalesSeleccionados, setAnimalesSeleccionados] = useState<string[]>([])
  const [modalAplicaciones, setModalAplicaciones] = useState(false)
  const [productos, setProductos] = useState<any[]>([])
  const [formularioAplicacion, setFormularioAplicacion] = useState({
    Producto: '',
    Id_producto: '',
    Costo: undefined as number | undefined,
    Cantidad: '',
    Motivo: '',
    $createdAt: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    cargarAnimales()
  }, []) // Solo se ejecuta al montar el componente

  // useEffect separado para manejar el parámetro de nuevo registro
  useEffect(() => {
    // Verificar si viene de un registro exitoso
    const nuevoRegistrado = searchParams.get('nuevo')
    if (nuevoRegistrado === 'registrado') {
      setMensajeExito('¡Animal registrado exitosamente!')
      // Limpiar el parámetro URL
      window.history.replaceState({}, '', '/ganado')
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => setMensajeExito(null), 3000)
      // Forzar recarga después de mostrar mensaje
      setTimeout(() => {
        console.log('Forzando recarga después de registro...')
        cargarAnimales()
      }, 1000)
    }
  }, [searchParams])

  // Cargar productos cuando se active el modo selección
  useEffect(() => {
    if (modoSeleccion) {
      cargarProductos()
    }
  }, [modoSeleccion])

  // Aplicar filtros y búsqueda cuando cambien los datos o los filtros
  useEffect(() => {
    console.log('Actualizando filtros, animales.length:', animales.length)
    console.log('Filtro estado actual:', filtroEstado)
    let filtrados = [...animales]

    // Mostrar información de animales vendidos vs no vendidos
    const vendidos = animales.filter(animal => !!animal.fecha_venta)
    const noVendidos = animales.filter(animal => !animal.fecha_venta)
    console.log('Animales vendidos:', vendidos.length)
    console.log('Animales no vendidos:', noVendidos.length)

    // Aplicar filtro por estado
    if (filtroEstado !== 'Todos') {
      filtrados = filtrados.filter(animal => {
        const estaVendido = !!animal.fecha_venta
        return filtroEstado === 'Vendidos' ? estaVendido : !estaVendido
      })
    }

    // Aplicar búsqueda
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase().trim()
      filtrados = filtrados.filter(animal => {
        const idAnimal = (animal.id_animal || '').toLowerCase()
        const farmNombre = (animal.farm_nombre || '').toLowerCase()
        return idAnimal.includes(terminoBusqueda) || farmNombre.includes(terminoBusqueda)
      })
    }

    console.log('Animales filtrados:', filtrados.length)
    setAnimalesFiltrados(filtrados)
  }, [animales, busqueda, filtroEstado])

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
      
      // Agregar un parámetro único para evitar caché
      const cacheBuster = Date.now() + Math.random()
      console.log(`Cache buster: ${cacheBuster}`)
      console.log('Iniciando consulta a Appwrite...')
      
      // Forzar una consulta fresca con límite aumentado para obtener todos los registros
      const response = await databases.listDocuments(
        DATABASE_ID,
        GANADO_COLLECTION_ID,
        [
          Query.limit(100), // Usar la sintaxis correcta de Appwrite para límite
          Query.orderDesc('$createdAt') // Ordenar por fecha de creación descendente
        ]
      )
      
      console.log('Consulta completada, procesando respuesta...')
      
      console.log('Respuesta recibida:', response)
      console.log('Número de documentos:', response.documents.length)
      console.log('Documentos:', response.documents)
      
      // Forzar la actualización del estado con los nuevos datos
      const nuevosDatos = response.documents as Animal[]
      setAnimales(nuevosDatos)
      
      // Forzar actualización de la clave para asegurar re-renderizado
      setRefreshKey(prev => prev + 1)
      
      // Verificar que los datos se cargaron correctamente
      if (nuevosDatos.length > 0) {
        console.log('Datos cargados exitosamente:', nuevosDatos.length, 'documentos')
        console.log('Primer documento:', nuevosDatos[0])
      } else {
        console.log('No se encontraron documentos')
      }
      
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

  const cargarProductos = async () => {
    try {
      if (!DATABASE_ID || !APLICACIONES_COLLECTION_ID) return
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        APLICACIONES_COLLECTION_ID
      )
      
      setProductos(response.documents)
    } catch (err) {
      console.error('Error al cargar productos:', err)
    }
  }

  const toggleSeleccionAnimal = (animalId: string) => {
    setAnimalesSeleccionados(prev => {
      if (prev.includes(animalId)) {
        return prev.filter(id => id !== animalId)
      } else {
        return [...prev, animalId]
      }
    })
  }

  const abrirModalAplicaciones = () => {
    if (animalesSeleccionados.length === 0) {
      setMensajeExito('Por favor seleccione al menos un animal')
      setTimeout(() => setMensajeExito(null), 3000)
      return
    }
    setModalAplicaciones(true)
  }

  const cerrarModalAplicaciones = () => {
    setModalAplicaciones(false)
    setFormularioAplicacion({
      Producto: '',
      Id_producto: '',
      Costo: undefined,
      Cantidad: '',
      Motivo: '',
      $createdAt: new Date().toISOString().split('T')[0]
    })
  }

  const manejarCambioAplicacion = (campo: string, valor: any) => {
    if (campo === 'Costo') {
      const costoValor = valor === '' || valor === null || valor === undefined ? undefined : parseFloat(valor);
      setFormularioAplicacion(prev => ({
        ...prev,
        Costo: costoValor
      }));
    } else {
      setFormularioAplicacion(prev => ({
        ...prev,
        [campo]: valor
      }));
    }

    // Si cambia el producto, actualizar también el Id_producto
    if (campo === 'Producto') {
      const productoSeleccionado = productos.find(p => p.$id === valor)
      if (productoSeleccionado) {
        setFormularioAplicacion(prev => ({
          ...prev,
          Id_producto: productoSeleccionado.$id
        }))
      }
    }
  }

  const aplicarProductoAMultiplesAnimales = async () => {
    if (!formularioAplicacion.Producto || !formularioAplicacion.Id_producto) {
      setMensajeExito('Por favor seleccione un producto')
      setTimeout(() => setMensajeExito(null), 3000)
      return
    }

    try {
      setLoading(true)
      
      // Obtener los datos de los animales seleccionados
      const animalesSeleccionadosData = animales.filter(animal =>
        animalesSeleccionados.includes(animal.$id)
      )

      // Crear una aplicación para cada animal seleccionado
      const promesasAplicaciones = animalesSeleccionadosData.map(async (animal) => {
        const nuevaAplicacion = {
          Producto: productos.find(p => p.$id === formularioAplicacion.Producto)?.['Nombre'] || '',
          Id_animal: animal.id_animal || animal.$id,
          Id_producto: formularioAplicacion.Id_producto,
          Costo: formularioAplicacion.Costo,
          Cantidad: formularioAplicacion.Cantidad || '',
          Motivo: formularioAplicacion.Motivo || '',
          $createdAt: formularioAplicacion.$createdAt
        }

        return databases.createDocument(
          DATABASE_ID,
          APLICACIONESANIMAL_COLLECTION_ID,
          'unique()',
          nuevaAplicacion
        )
      })

      await Promise.all(promesasAplicaciones)

      setMensajeExito(`Aplicación registrada exitosamente a ${animalesSeleccionados.length} animal(es)`)
      cerrarModalAplicaciones()
      
      // Salir del modo selección
      setModoSeleccion(false)
      setAnimalesSeleccionados([])
      
      setTimeout(() => setMensajeExito(null), 3000)
    } catch (err) {
      console.error('Error al registrar aplicaciones:', err)
      setError('Error al registrar las aplicaciones')
    } finally {
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
                {animalesFiltrados.length} {animalesFiltrados.length === 1 ? 'Animal' : 'Animales'}
              </span>
            </div>
          </div>
        </div>

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

        {/* Botones de acción */}
        <div className="mb-6 flex justify-center gap-4">
          {!modoSeleccion && (
            <button
              onClick={() => router.push('/ganado/nuevo')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Registrar Nuevo Animal</span>
            </button>
          )}
          <button
            onClick={() => setModoSeleccion(!modoSeleccion)}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 ${
              modoSeleccion
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{modoSeleccion ? 'Cancelar Selección' : 'Aplicaciones'}</span>
          </button>
          {modoSeleccion && animalesSeleccionados.length > 0 && (
            <button
              onClick={abrirModalAplicaciones}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Aplicar a {animalesSeleccionados.length} animal(es)</span>
            </button>
          )}
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Buscador */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por ID de animal o finca..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Filtros por estado */}
          <div className="flex flex-wrap gap-2">
            {(['Activos', 'Vendidos', 'Todos'] as const).map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filtroEstado === estado
                    ? 'bg-emerald-500 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {estado}
              </button>
            ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {animalesFiltrados.map((animal) => (
              <div
                key={animal.$id}
                onClick={() => {
                  if (modoSeleccion) {
                    toggleSeleccionAnimal(animal.$id)
                  } else {
                    router.push(`/ganado/${animal.$id}`)
                  }
                }}
                className={`group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] overflow-hidden cursor-pointer ${
                  animalesSeleccionados.includes(animal.$id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Checkbox para modo selección - Posicionado en esquina superior izquierda */}
                {modoSeleccion && (
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={animalesSeleccionados.includes(animal.$id)}
                      onChange={() => toggleSeleccionAnimal(animal.$id)}
                      className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-1 shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                {/* Efecto de brillo superior */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                
                {/* Header con gradiente dinámico - Más compacto */}
                <div className={`
                  relative overflow-hidden p-3 bg-gradient-to-br
                  ${animal.fecha_venta
                    ? 'from-red-400 to-red-600'
                    : 'from-emerald-400 to-teal-600'
                  } text-white
                `}>
                  {/* Patrón de fondo animado - Más pequeño */}
                  <div className="absolute inset-0 opacity-10">
                    <div className={`absolute text-2xl transform rotate-12 ${
                      modoSeleccion ? 'top-1 right-1' : 'top-1 right-1'
                    }`}>
                      🐄
                    </div>
                  </div>
                   
                  <div className="relative z-10">
                    <div className={`flex justify-between items-start ${
                      modoSeleccion ? 'mt-6' : ''
                    }`}>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white mb-0.5">
                          #{animal.id_animal || 'N/A'}
                        </h3>
                        <p className="text-white/80 text-xs truncate">
                          {animal.farm_nombre || 'Sin finca'}
                        </p>
                      </div>
                      {!modoSeleccion && (
                        <div className="ml-1">
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-semibold
                            ${animal.fecha_venta
                              ? 'bg-red-600 text-white'
                              : 'bg-green-600 text-white'
                            }
                          `}>
                            {animal.fecha_venta ? 'Vendido' : 'Activo'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenido principal - Más compacto */}
                <div className="p-3">
                  {/* Información adicional - Diseño más simple */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 text-xs">📅</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600">
                          {animal.fecha_compra ? formatearFecha(animal.fecha_compra) : 'Sin fecha'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-xs">💰</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 font-medium truncate">
                          ₡{(() => {
                            const precio = animal.Precio_compra || animal.precio_kg;
                            if (typeof precio === 'number') {
                              return precio.toLocaleString('es-CR');
                            } else if (typeof precio === 'string') {
                              const numero = parseFloat(precio);
                              return isNaN(numero) ? '0' : numero.toLocaleString('es-CR');
                            } else {
                              return '0';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicador visual de estado - Más simple */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        animal.fecha_venta ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-xs text-gray-600">
                        {animal.fecha_venta ? 'Vendido' : 'Disponible'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State con diseño mejorado */}
        {!loading && !error && animalesFiltrados.length === 0 && (
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

      {/* Modal para aplicar productos a múltiples animales */}
      {modalAplicaciones && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Aplicar Producto</h2>
              <button
                onClick={cerrarModalAplicaciones}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Se aplicará el producto a {animalesSeleccionados.length} animal(es) seleccionado(s)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producto *
                  </label>
                  <select
                    value={formularioAplicacion.Producto}
                    onChange={(e) => manejarCambioAplicacion('Producto', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Seleccione un producto</option>
                    {productos.map((producto) => (
                      <option key={producto.$id} value={producto.$id}>
                        {producto['Nombre']} {producto.Tipo && `- ${producto.Tipo}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="text"
                    value={formularioAplicacion.Cantidad}
                    onChange={(e) => manejarCambioAplicacion('Cantidad', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="Ej: 1 dosis, 500ml, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo (₡)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formularioAplicacion.Costo || ''}
                    onChange={(e) => manejarCambioAplicacion('Costo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo
                  </label>
                  <textarea
                    value={formularioAplicacion.Motivo}
                    onChange={(e) => manejarCambioAplicacion('Motivo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-none"
                    placeholder="Motivo de la aplicación"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de aplicación
                  </label>
                  <input
                    type="date"
                    value={formularioAplicacion.$createdAt}
                    onChange={(e) => manejarCambioAplicacion('$createdAt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={cerrarModalAplicaciones}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={aplicarProductoAMultiplesAnimales}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Aplicando...' : 'Aplicar Producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GanadoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <GanadoContent />
    </Suspense>
  )
}