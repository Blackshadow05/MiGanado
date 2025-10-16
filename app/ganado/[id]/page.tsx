'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { databases, DATABASE_ID, GANADO_COLLECTION_ID, FINCA_COLLECTION_ID, APLICACIONES_COLLECTION_ID, APLICACIONESANIMAL_COLLECTION_ID } from '@/lib/appwrite'
import { Query } from 'appwrite'
import Image from 'next/image'

interface Animal {
  $id: string
  id_animal?: string
  peso_entrada?: number
  precio_kg?: number
  fecha_compra?: string
  Precio_compra?: number | string
  farm_nombre?: string
  farm_id?: string
  precio_kg_venta?: number
  peso_salida?: number | string
  Precio_venta?: number | string
  Imagen?: string
  fecha_venta?: string
}

interface Finca {
  $id: string
  nombre?: string
}

interface Producto {
  $id: string
  'Nombre'?: string
  Tipo?: string
  Descripcion?: string
}

interface AplicacionAnimal {
  $id: string
  Producto?: string
  Id_animal?: string
  Id_producto?: string
  Costo?: number
  Cantidad?: string
  Motivo?: string
  Fecha?: string
  $createdAt?: string
}

interface FormularioAplicacion {
  Producto: string
  Id_producto: string
  Costo: number | undefined
  Cantidad: string
  Motivo: string
  Fecha: string
}

export default function DetalleAnimalPage() {
  const router = useRouter()
  const params = useParams()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imagenExpandida, setImagenExpandida] = useState(false)
  const [modalEdicion, setModalEdicion] = useState(false)
  const [modalEliminacion, setModalEliminacion] = useState(false)
  const [modalVenta, setModalVenta] = useState(false)
  const [animalEditando, setAnimalEditando] = useState<Animal | null>(null)
  const [animalVendiendo, setAnimalVendiendo] = useState<Animal | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState<string | null>(null)
  const [fincas, setFincas] = useState<Finca[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [aplicaciones, setAplicaciones] = useState<AplicacionAnimal[]>([])
  const [modalAplicacion, setModalAplicacion] = useState(false)
  const [modalEdicionAplicacion, setModalEdicionAplicacion] = useState(false)
  const [aplicacionEditando, setAplicacionEditando] = useState<AplicacionAnimal | null>(null)
  const [aplicacionAEliminar, setAplicacionAEliminar] = useState<AplicacionAnimal | null>(null)

  // Memoizar formularios iniciales
  const formularioInicial = useMemo(() => ({
    Producto: '',
    Id_producto: '',
    Costo: undefined,
    Cantidad: '',
    Motivo: '',
    Fecha: new Date().toLocaleDateString('es-CR') // Formato dd/mm/yyyy
  }), [])

  const [formularioAplicacion, setFormularioAplicacion] = useState<FormularioAplicacion>(formularioInicial)
  const [formularioEdicionAplicacion, setFormularioEdicionAplicacion] = useState<FormularioAplicacion>(formularioInicial)

  useEffect(() => {
    if (params.id) {
      cargarAnimal(params.id as string)
      cargarFincas()
      cargarProductos()
    }
  }, [params.id])

  // Segundo useEffect para cargar aplicaciones después de que el animal se haya cargado
  useEffect(() => {
    if (animal && params.id) {
      console.log('Animal cargado, ahora cargando aplicaciones...')
      cargarAplicaciones(params.id as string)
    }
  }, [animal, params.id])

  const cargarAnimal = useCallback(async (id: string, intentos = 3) => {
    try {
      setLoading(true)
      console.log('Cargando animal con ID:', id)

      if (!DATABASE_ID || !GANADO_COLLECTION_ID) {
        throw new Error('Faltan variables de entorno de Appwrite')
      }

      if (!databases) {
        throw new Error('No se pudo establecer conexión con Appwrite')
      }

      const response = await databases.getDocument(
        DATABASE_ID,
        GANADO_COLLECTION_ID,
        id
      )

      console.log('Animal cargado:', response)
      setAnimal(response as Animal)
    } catch (err) {
      console.error('Error completo al cargar animal:', err)

      let errorMessage = 'Error al cargar el animal'
      if (err instanceof Error) {
        errorMessage = err.message

        if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet y que el servidor esté disponible.'
        } else if (err.name === 'AbortError') {
          errorMessage = 'La conexión tardó demasado tiempo. Intentando nuevamente...'
        } else if (err.message.includes('CORS')) {
          errorMessage = 'Error de CORS. Verifica la configuración del servidor.'
        }
      }

      if (intentos > 1) {
        console.log(`Reintentando... (${intentos - 1} intentos restantes)`)
        setTimeout(() => cargarAnimal(id, intentos - 1), 2000)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [databases, DATABASE_ID, GANADO_COLLECTION_ID, setLoading, setError, setAnimal, router, params.id])

  const formatearFecha = useCallback((fecha: string | undefined): string => {
    if (!fecha) return 'No disponible'

    // Si la fecha ya está en formato dd/mm/yyyy, devolverla tal cual
    if (fecha.includes('/') && fecha.length === 10) {
      return fecha
    }

    // Si es una fecha ISO o en formato YYYY-MM-DD, convertirla
    try {
      const date = new Date(fecha)
      if (isNaN(date.getTime())) {
        // Intentar parsear como YYYY-MM-DD
        const [year, month, day] = fecha.split('-')
        if (year && month && day) {
          return `${day}/${month}/${year}`
        }
        return 'No disponible'
      }
      return date.toLocaleDateString('es-CR')
    } catch {
      return 'No disponible'
    }
  }, [])

  const convertirFechaADDMMAAAA = useCallback((fechaISO: string): string => {
    if (!fechaISO) return new Date().toLocaleDateString('es-CR')

    // Si ya viene en formato dd/mm/yyyy, devolverla
    if (fechaISO.includes('/') && fechaISO.length === 10) {
      return fechaISO
    }

    // Convertir de YYYY-MM-DD a dd/mm/yyyy sin problemas de zona horaria
    if (fechaISO.includes('-') && fechaISO.length === 10) {
      const [year, month, day] = fechaISO.split('-')
      return `${day}/${month}/${year}`
    }

    // Para otros formatos, usar Date pero con cuidado
    try {
      const date = new Date(fechaISO + 'T00:00:00') // Forzar mediodía para evitar problemas de zona horaria
      if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString('es-CR')
      }
      return date.toLocaleDateString('es-CR')
    } catch {
      return new Date().toLocaleDateString('es-CR')
    }
  }, [])

  const convertirFechaAYYYYMMDD = useCallback((fechaDDMMYYYY: string): string => {
    if (!fechaDDMMYYYY) return new Date().toISOString().split('T')[0]

    // Si ya viene en formato YYYY-MM-DD, devolverla
    if (fechaDDMMYYYY.includes('-') && fechaDDMMYYYY.length === 10) {
      return fechaDDMMYYYY
    }

    // Convertir de dd/mm/yyyy a YYYY-MM-DD sin problemas de zona horaria
    try {
      const [day, month, year] = fechaDDMMYYYY.split('/')
      if (day && month && year) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    } catch {
      // Si hay error, devolver fecha actual
    }

    return new Date().toISOString().split('T')[0]
  }, [])

  const formatearMoneda = useCallback((valor: number | string | undefined): string => {
    if (!valor) return 'No registrado'

    const numero = typeof valor === 'number' ? valor : parseFloat(valor as string)
    if (isNaN(numero)) return 'No registrado'

    return `₡${numero.toLocaleString('es-CR')}`
  }, [])

  const cargarFincas = useCallback(async () => {
    try {
      if (!DATABASE_ID || !FINCA_COLLECTION_ID) return

      const response = await databases.listDocuments(
        DATABASE_ID,
        FINCA_COLLECTION_ID
      )

      setFincas(response.documents as Finca[])
    } catch (err) {
      console.error('Error al cargar fincas:', err)
    }
  }, [databases, DATABASE_ID, FINCA_COLLECTION_ID, setFincas])

  const cargarProductos = useCallback(async () => {
    try {
      if (!DATABASE_ID || !APLICACIONES_COLLECTION_ID) return

      const response = await databases.listDocuments(
        DATABASE_ID,
        APLICACIONES_COLLECTION_ID
      )

      setProductos(response.documents as Producto[])
    } catch (err) {
      console.error('Error al cargar productos:', err)
    }
  }, [databases, DATABASE_ID, APLICACIONES_COLLECTION_ID, setProductos])

  const cargarAplicaciones = useCallback(async (animalId: string) => {
    try {
      if (!DATABASE_ID || !APLICACIONESANIMAL_COLLECTION_ID) return

      // Buscar aplicaciones por el ID del animal (usar el id_animal si existe, sino el $id)
      const idAnimalBusqueda = animal?.id_animal || animalId

      const response = await databases.listDocuments(
        DATABASE_ID,
        APLICACIONESANIMAL_COLLECTION_ID,
        [Query.equal('Id_animal', idAnimalBusqueda)]
      )

      // Filtrar aplicaciones que tengan Id_producto válido
      let aplicacionesFiltradas = response.documents.filter(doc =>
        doc.Id_producto && doc.Id_producto !== ''
      ) as AplicacionAnimal[]

      // Ordenar aplicaciones de más reciente a más antiguo por $createdAt
      aplicacionesFiltradas = aplicacionesFiltradas.sort((a, b) => {
        const dateA = a.$createdAt ? new Date(a.$createdAt).getTime() : 0;
        const dateB = b.$createdAt ? new Date(b.$createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setAplicaciones(aplicacionesFiltradas)
    } catch (err) {
      console.error('Error al cargar aplicaciones:', err)
    }
  }, [animal, params.id, databases, DATABASE_ID, APLICACIONESANIMAL_COLLECTION_ID, setAplicaciones])

  const toggleImagenExpandida = useCallback(() => {
    setImagenExpandida(prev => !prev)
  }, [])

  const abrirModalEdicion = useCallback(() => {
    if (animal) {
      setAnimalEditando({ ...animal })
      setModalEdicion(true)
    }
  }, [animal, setAnimalEditando, setModalEdicion])

  const cerrarModalEdicion = useCallback(() => {
    setModalEdicion(false)
    setAnimalEditando(null)
  }, [])

  const abrirModalEliminacion = useCallback(() => {
    setModalEliminacion(true)
  }, [])

  const cerrarModalEliminacion = useCallback(() => {
    setModalEliminacion(false)
  }, [])

  const abrirModalVenta = useCallback(() => {
    if (animal) {
      setAnimalVendiendo({ ...animal })
      setModalVenta(true)
    }
  }, [animal, setAnimalVendiendo, setModalVenta])

  const cerrarModalVenta = useCallback(() => {
    setModalVenta(false)
    setAnimalVendiendo(null)
  }, [])

  const manejarCambioCampo = useCallback((campo: string, valor: string | number | undefined) => {
    if (animalEditando) {
      const nuevoAnimal = {
        ...animalEditando,
        [campo]: valor
      }

      // Calcular automáticamente precios totales
      if (campo === 'peso_entrada' || campo === 'precio_kg') {
        const peso = campo === 'peso_entrada' ? Number(valor) : Number(nuevoAnimal.peso_entrada)
        const precioKg = campo === 'precio_kg' ? Number(valor) : Number(nuevoAnimal.precio_kg)

        if (peso && precioKg) {
          nuevoAnimal.Precio_compra = Math.round(peso * precioKg * 100) / 100
        }
      }

      if (campo === 'peso_salida' || campo === 'precio_kg_venta') {
        const peso = campo === 'peso_salida' ? Number(valor) : Number(nuevoAnimal.peso_salida)
        const precioKg = campo === 'precio_kg_venta' ? Number(valor) : Number(nuevoAnimal.precio_kg_venta)

        if (peso && precioKg) {
          nuevoAnimal.Precio_venta = Math.round(peso * precioKg * 100) / 100
        }
      }

      setAnimalEditando(nuevoAnimal)
    }
  }, [animalEditando, setAnimalEditando])

  const guardarCambios = useCallback(async () => {
    if (!animalEditando || !animal) return

    try {
      setLoading(true)

      // Preparar los datos para Appwrite - convertir números a strings
      const datosParaActualizar: Record<string, string | number> = {}

      Object.keys(animalEditando).forEach(key => {
        const valor = animalEditando[key as keyof Animal]

        if (typeof valor === 'number') {
          // Convertir números a strings con formato adecuado
          datosParaActualizar[key] = valor.toString()
        } else if (valor !== undefined && valor !== null) {
          // Mantener otros valores como están
          datosParaActualizar[key] = valor
        }
      })

      // Asegurar que los campos tengan el formato correcto para Appwrite según especificación
      if (datosParaActualizar.Precio_compra) {
        // Precio_compra debe ser string
        datosParaActualizar.Precio_compra = Math.round(parseFloat(datosParaActualizar.Precio_compra as string)).toString()
      }
      if (datosParaActualizar.Precio_venta) {
        // Precio_venta debe ser string
        datosParaActualizar.Precio_venta = Math.round(parseFloat(datosParaActualizar.Precio_venta as string)).toString()
      }
      if (datosParaActualizar.precio_kg) {
        // precio_kg debe ser número (mantener como número)
        datosParaActualizar.precio_kg = Math.round(parseFloat(datosParaActualizar.precio_kg as string))
      }
      if (datosParaActualizar.precio_kg_venta) {
        // precio_kg_venta debe ser número (mantener como número)
        datosParaActualizar.precio_kg_venta = Math.round(parseFloat(datosParaActualizar.precio_kg_venta as string))
      }
      if (datosParaActualizar.peso_entrada) {
        // peso_entrada debe ser número (mantener como número)
        datosParaActualizar.peso_entrada = Math.round(parseFloat(datosParaActualizar.peso_entrada as string))
      }
      if (datosParaActualizar.peso_salida) {
        // peso_salida debe ser string
        datosParaActualizar.peso_salida = Math.round(parseFloat(datosParaActualizar.peso_salida as string)).toString()
      }

      const response = await databases.updateDocument(
        DATABASE_ID,
        GANADO_COLLECTION_ID,
        animal.$id,
        datosParaActualizar
      )

      setAnimal(response as Animal)
      setMensajeExito('Animal actualizado exitosamente')
      cerrarModalEdicion()

      setTimeout(() => setMensajeExito(null), 3000)
    } catch (err) {
      console.error('Error al actualizar animal:', err)
      setError('Error al actualizar el animal')
    } finally {
      setLoading(false)
    }
  }, [animalEditando, animal, cerrarModalEdicion, setLoading, setMensajeExito, setError, databases, DATABASE_ID, GANADO_COLLECTION_ID])

  const eliminarAnimal = useCallback(async () => {
    if (!animal) return

    try {
      setLoading(true)
      await databases.deleteDocument(
        DATABASE_ID,
        GANADO_COLLECTION_ID,
        animal.$id
      )

      setMensajeExito('Animal eliminado exitosamente')
      cerrarModalEliminacion()

      setTimeout(() => {
        router.push('/ganado')
      }, 2000)
    } catch (err) {
      console.error('Error al eliminar animal:', err)
      setError('Error al eliminar el animal')
      setLoading(false)
    }
  }, [animal, cerrarModalEliminacion, router, setLoading, setMensajeExito, setError, databases, DATABASE_ID, GANADO_COLLECTION_ID])

  const manejarCambioVenta = useCallback((campo: string, valor: string | number | undefined) => {
    if (animalVendiendo) {
      const nuevoAnimal = {
        ...animalVendiendo,
        [campo]: valor
      }

      // Calcular automáticamente el precio de venta
      if (campo === 'peso_salida' || campo === 'precio_kg_venta') {
        const peso = campo === 'peso_salida' ? Number(valor) : Number(nuevoAnimal.peso_salida)
        const precioKg = campo === 'precio_kg_venta' ? Number(valor) : Number(nuevoAnimal.precio_kg_venta)

        if (peso && precioKg) {
          nuevoAnimal.Precio_venta = Math.round(peso * precioKg * 100) / 100
        }
      }

      setAnimalVendiendo(nuevoAnimal)
    }
  }, [animalVendiendo, setAnimalVendiendo])

  const guardarVenta = useCallback(async () => {
    if (!animalVendiendo || !animal) return

    try {
      setLoading(true)

      // Validar campos requeridos
      if (!animalVendiendo.peso_salida || !animalVendiendo.precio_kg_venta || !animalVendiendo.fecha_venta) {
        setMensajeAdvertencia('Por favor complete todos los campos requeridos')
        setTimeout(() => setMensajeAdvertencia(null), 3000)
        setLoading(false)
        return
      }

      // Preparar los datos para Appwrite
      const datosParaActualizar: Record<string, string | number> = {
        peso_salida: Math.round(parseFloat(animalVendiendo.peso_salida.toString())).toString(),
        precio_kg_venta: Math.round(parseFloat(animalVendiendo.precio_kg_venta.toString())),
        fecha_venta: animalVendiendo.fecha_venta
      }
      
      // Calcular y agregar el precio de venta
      if (animalVendiendo.Precio_venta) {
        datosParaActualizar.Precio_venta = Math.round(parseFloat(animalVendiendo.Precio_venta.toString())).toString()
      }

      const response = await databases.updateDocument(
        DATABASE_ID,
        GANADO_COLLECTION_ID,
        animal.$id,
        datosParaActualizar
      )

      setAnimal(response as Animal)
      setMensajeExito('Animal vendido exitosamente')
      cerrarModalVenta()

      setTimeout(() => setMensajeExito(null), 3000)
    } catch (err) {
      console.error('Error al vender animal:', err)
      setError('Error al vender el animal')
    } finally {
      setLoading(false)
    }
  }, [animalVendiendo, animal, cerrarModalVenta, setLoading, setMensajeAdvertencia, setMensajeExito, databases, DATABASE_ID, GANADO_COLLECTION_ID, router])

  const abrirModalAplicacion = useCallback(() => {
    setModalAplicacion(true)
    setFormularioAplicacion(formularioInicial)
  }, [formularioInicial, setModalAplicacion, setFormularioAplicacion])

  const cerrarModalAplicacion = useCallback(() => {
    setModalAplicacion(false)
    setAplicacionEditando(null)
  }, [setModalAplicacion, setAplicacionEditando])

  const manejarCambioAplicacion = useCallback((campo: string, valor: string | number | undefined) => {
    if (campo === 'Costo') {
      // Manejar específicamente el campo Costo para permitir valores vacíos
      const costoValor = valor === '' || valor === null || valor === undefined ? undefined : parseFloat(valor as string);
      setFormularioAplicacion(prev => ({
        ...prev,
        Costo: costoValor
      }));
    } else if (campo === 'Fecha') {
      // Convertir de YYYY-MM-DD a dd/mm/yyyy
      const fechaConvertida = convertirFechaADDMMAAAA(valor as string);
      setFormularioAplicacion(prev => ({
        ...prev,
        Fecha: fechaConvertida
      }));
    } else {
      setFormularioAplicacion(prev => ({
        ...prev,
        [campo]: valor
      }));
    }

    // Si cambia el producto, actualizar también el Id_producto
    if (campo === 'Producto') {
      const productoSeleccionado = productos.find(p => p.$id === (valor as string))
      if (productoSeleccionado) {
        setFormularioAplicacion(prev => ({
          ...prev,
          Id_producto: productoSeleccionado.$id
        }))
      }
    }
  }, [productos, convertirFechaADDMMAAAA])

  const guardarAplicacion = useCallback(async () => {
    if (!animal || !formularioAplicacion.Producto || !formularioAplicacion.Id_producto) {
      setMensajeAdvertencia('Por favor seleccione un producto')
      setTimeout(() => setMensajeAdvertencia(null), 3000)
      return
    }

    try {
      setLoading(true)

      const datosAplicacion: Record<string, string | number> = {
        Producto: productos.find((p: Producto) => p.$id === formularioAplicacion.Producto)?.['Nombre'] || '',
        Id_animal: animal.id_animal || animal.$id,
        Id_producto: formularioAplicacion.Id_producto,
        Cantidad: formularioAplicacion.Cantidad || '',
        Motivo: formularioAplicacion.Motivo || '',
        Fecha: convertirFechaAYYYYMMDD(formularioAplicacion.Fecha)
      }

      // Solo incluir Costo si tiene un valor definido
      if (formularioAplicacion.Costo !== undefined) {
        datosAplicacion.Costo = formularioAplicacion.Costo
      }

      const response = await databases.createDocument(
        DATABASE_ID,
        APLICACIONESANIMAL_COLLECTION_ID,
        'unique()',
        datosAplicacion
      )

      console.log('Aplicación creada:', response)
      setFormularioAplicacion(formularioInicial)
      setModalAplicacion(false)
      setMensajeExito('Aplicación agregada exitosamente')

      // Recargar aplicaciones
      if (params.id) {
        cargarAplicaciones(params.id as string)
      }

      setTimeout(() => setMensajeExito(null), 3000)
    } catch (err) {
      console.error('Error al guardar aplicación:', err)
      setError('Error al guardar la aplicación')
    } finally {
      setLoading(false)
    }
  }, [animal, formularioAplicacion, productos, formularioInicial, params.id, cargarAplicaciones, convertirFechaAYYYYMMDD, setLoading, setMensajeAdvertencia, setMensajeExito, setFormularioAplicacion, setModalAplicacion])

  const eliminarAplicacion = useCallback(async (aplicacionId: string) => {
    const aplicacion = aplicaciones.find((a: AplicacionAnimal) => a.$id === aplicacionId);
    if (aplicacion) {
      setAplicacionAEliminar(aplicacion);
    }
  }, [aplicaciones, setAplicacionAEliminar])

  const confirmarEliminarAplicacion = useCallback(async () => {
    if (!aplicacionAEliminar) return;

    try {
      setLoading(true)
      
      await databases.deleteDocument(
        DATABASE_ID,
        APLICACIONESANIMAL_COLLECTION_ID,
        aplicacionAEliminar.$id
      )

      if (params.id) {
        cargarAplicaciones(params.id as string)
      }
      
      setMensajeExito('Aplicación eliminada exitosamente')
      setAplicacionAEliminar(null)
      setTimeout(() => setMensajeExito(null), 3000)
    } catch (err) {
      console.error('Error al eliminar aplicación:', err)
      setMensajeAdvertencia('Error al eliminar la aplicación')
      setTimeout(() => setMensajeAdvertencia(null), 3000)
    } finally {
      setLoading(false)
    }
  }, [aplicacionAEliminar, params.id, cargarAplicaciones, setLoading, setMensajeExito, setMensajeAdvertencia, setAplicacionAEliminar])

  const abrirModalEdicionAplicacion = useCallback((aplicacion: AplicacionAnimal) => {
    setAplicacionEditando(aplicacion)
    setFormularioEdicionAplicacion({
      Producto: aplicacion.Id_producto || '',
      Id_producto: aplicacion.Id_producto || '',
      Costo: aplicacion.Costo,
      Cantidad: aplicacion.Cantidad || '',
      Motivo: aplicacion.Motivo || '',
      Fecha: aplicacion.Fecha || (aplicacion.$createdAt ? new Date(aplicacion.$createdAt).toLocaleDateString('es-CR') : new Date().toLocaleDateString('es-CR'))
    })
    setModalEdicionAplicacion(true)
  }, [setModalEdicionAplicacion, setAplicacionEditando])

  const cerrarModalEdicionAplicacion = useCallback(() => {
    setModalEdicionAplicacion(false)
    setAplicacionEditando(null)
  }, [setAplicacionEditando, setFormularioEdicionAplicacion, setModalEdicionAplicacion])

  const manejarCambioEdicionAplicacion = useCallback((campo: string, valor: string | number | undefined) => {
    if (campo === 'Costo') {
      const costoValor = valor === '' || valor === null || valor === undefined ? undefined : parseFloat(valor as string);
      setFormularioEdicionAplicacion(prev => ({
        ...prev,
        Costo: costoValor
      }));
    } else if (campo === 'Fecha') {
      const fechaConvertida = convertirFechaADDMMAAAA(valor as string);
      setFormularioEdicionAplicacion(prev => ({
        ...prev,
        Fecha: fechaConvertida
      }));
    } else {
      setFormularioEdicionAplicacion(prev => ({
        ...prev,
        [campo]: valor
      }));
    }

    if (campo === 'Producto') {
      const productoSeleccionado = productos.find((p: Producto) => p.$id === (valor as string))
      if (productoSeleccionado) {
        setFormularioEdicionAplicacion(prev => ({
          ...prev,
          Id_producto: productoSeleccionado.$id,
          Producto: productoSeleccionado['Nombre'] || ''
        }))
      }
    }
  }, [productos, convertirFechaADDMMAAAA])

  const guardarEdicionAplicacion = useCallback(async () => {
    if (!aplicacionEditando || !formularioEdicionAplicacion.Producto || !formularioEdicionAplicacion.Id_producto) {
      setMensajeAdvertencia('Por favor seleccione un producto')
      setTimeout(() => setMensajeAdvertencia(null), 3000)
      return
    }

    try {
      setLoading(true)
      
      const datosActualizados: Record<string, string | number> = {
        Producto: productos.find((p: Producto) => p.$id === formularioEdicionAplicacion.Producto)?.['Nombre'] || formularioEdicionAplicacion.Producto,
        Id_producto: formularioEdicionAplicacion.Id_producto,
        Cantidad: formularioEdicionAplicacion.Cantidad || '',
        Motivo: formularioEdicionAplicacion.Motivo || '',
        Fecha: convertirFechaAYYYYMMDD(formularioEdicionAplicacion.Fecha)
      }

      if (formularioEdicionAplicacion.Costo !== undefined) {
        datosActualizados.Costo = formularioEdicionAplicacion.Costo
      }

      await databases.updateDocument(
        DATABASE_ID,
        APLICACIONESANIMAL_COLLECTION_ID,
        aplicacionEditando.$id,
        datosActualizados
      )

      if (params.id) {
        cargarAplicaciones(params.id as string)
      }
      
      setMensajeExito('Aplicación actualizada exitosamente')
      setModalEdicionAplicacion(false)
      setAplicacionEditando(null)
      setTimeout(() => setMensajeExito(null), 3000)
    } catch (err) {
      console.error('Error al actualizar aplicación:', err)
      setMensajeAdvertencia('Error al actualizar la aplicación')
      setTimeout(() => setMensajeAdvertencia(null), 3000)
    } finally {
      setLoading(false)
    }
  }, [aplicacionEditando, formularioEdicionAplicacion, productos, params.id, cargarAplicaciones, convertirFechaAYYYYMMDD, setLoading, setMensajeAdvertencia, setMensajeExito])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200"></div>
              <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !animal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6 shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-red-700 font-medium">{error || 'No se encontró el animal'}</p>
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
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Botón Volver */}
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
            <span className="font-medium">Volver a la lista</span>
          </button>
        </div>

        {/* Título Principal */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Detalle de Animal
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-3 text-sm sm:text-base">
            Información completa de {animal.id_animal || 'N/A'}
          </p>
        </div>

        {/* Tarjeta de Detalles */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Encabezado con gradiente */}
          <div className={`
            relative overflow-hidden p-6 bg-gradient-to-br 
            ${animal.fecha_venta 
              ? 'from-red-400 to-red-600' 
              : 'from-emerald-400 to-teal-600'
            } text-white
          `}>
            {/* Patrón de fondo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-2 text-4xl transform rotate-12">
                🐄
              </div>
            </div>

            <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1 break-words">
                  {animal.id_animal || 'N/A'}
                </h2>
                <p className="text-white/80 text-lg truncate">
                  {animal.farm_nombre || 'Sin finca'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:space-x-2 sm:ml-4">
                  <button
                    onClick={abrirModalEdicion}
                    className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all duration-300 transform hover:scale-110 flex-shrink-0"
                    title="Editar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {!animal.fecha_venta && (
                    <button
                      onClick={abrirModalVenta}
                      className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all duration-300 transform hover:scale-110 flex-shrink-0"
                      title="Vender"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={abrirModalEliminacion}
                    className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-300 transform hover:scale-110 flex-shrink-0"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <span className={`
                    px-3 py-2 rounded-full text-sm font-bold flex-shrink-0
                    ${animal.fecha_venta
                      ? 'bg-red-600 text-white'
                      : 'bg-green-600 text-white'
                    }
                  `}>
                    {animal.fecha_venta ? 'Vendido' : 'Disponible'}
                  </span>
                </div>
              </div>

              {animal.Imagen && (
                <div className="mt-4 flex justify-center">
                  <div
                    className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white/30 shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    onClick={toggleImagenExpandida}
                  >
                    <Image
                      src={animal.Imagen}
                      alt={`Imagen de ${animal.id_animal || 'animal'}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 hover:opacity-100 transition-opacity duration-300 text-xs sm:text-sm font-medium px-2 text-center">
                        Click para expandir
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información de compra */}
              <div className="bg-emerald-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-emerald-700 mb-4 flex items-center">
                  <span className="mr-2">📥</span>
                  Información de Compra
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Fecha de compra:</span>
                    <span className="text-gray-900 font-semibold">
                      {animal.fecha_compra ? formatearFecha(animal.fecha_compra) : 'No registrada'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Peso de entrada:</span>
                    <span className="text-gray-900 font-semibold">
                      {animal.peso_entrada ? `${animal.peso_entrada} kg` : 'No registrado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Precio por kg:</span>
                    <span className="text-gray-900 font-semibold">
                      {formatearMoneda(animal.precio_kg)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Precio total compra:</span>
                    <span className="text-gray-900 font-semibold">
                      {formatearMoneda(animal.Precio_compra)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información de venta - Solo mostrar si hay datos de venta */}
              {animal.fecha_venta && animal.Precio_venta && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-amber-700 mb-4 flex items-center">
                    <span className="mr-2">📤</span>
                    Información de Venta
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Fecha de venta:</span>
                      <span className="text-gray-900 font-semibold">
                        {formatearFecha(animal.fecha_venta)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Peso de salida:</span>
                      <span className="text-gray-900 font-semibold">
                        {animal.peso_salida ? `${animal.peso_salida} kg` : 'No registrado'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Precio por kg:</span>
                      <span className="text-gray-900 font-semibold">
                        {formatearMoneda(animal.precio_kg_venta)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Precio total venta:</span>
                      <span className="text-gray-900 font-semibold">
                        {formatearMoneda(animal.Precio_venta)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ganancia/Pérdida - Mostrar siempre */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
              <h3 className="text-lg font-semibold text-purple-700 mb-2 flex items-center">
                <span className="mr-2">💰</span>
                Resultado Financiero
              </h3>
              
              {/* Mostrar el total de gastos en aplicaciones */}
              {aplicaciones.length > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 font-medium">Gastos en aplicaciones:</span>
                  <span className="text-gray-900 font-semibold">
                    {formatearMoneda(aplicaciones.reduce((total, app) => total + (app.Costo || 0), 0))}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">
                  {animal.Precio_venta ? 'Ganancia/Pérdida:' : 'Total gastos en aplicaciones:'}
                </span>
                <span className={`
                  text-xl font-bold
                  ${animal.Precio_venta && animal.Precio_compra && (typeof animal.Precio_venta === 'number' ? animal.Precio_venta : parseFloat(animal.Precio_venta as string)) >= ((typeof animal.Precio_compra === 'number' ? animal.Precio_compra : parseFloat(animal.Precio_compra as string)) + aplicaciones.reduce((total, app) => total + (app.Costo || 0), 0)) ? 'text-green-600' :
                    animal.Precio_venta ? 'text-red-600' : 'text-blue-600'}
                `}>
                  {animal.Precio_venta && animal.Precio_compra ? (
                    <>
                      {formatearMoneda((typeof animal.Precio_venta === 'number' ? animal.Precio_venta : parseFloat(animal.Precio_venta as string)) - (typeof animal.Precio_compra === 'number' ? animal.Precio_compra : parseFloat(animal.Precio_compra as string)) - aplicaciones.reduce((total, app) => total + (app.Costo || 0), 0))}
                      <span className="text-sm ml-2">
                        ({(((typeof animal.Precio_venta === 'number' ? animal.Precio_venta : parseFloat(animal.Precio_venta as string)) - ((typeof animal.Precio_compra === 'number' ? animal.Precio_compra : parseFloat(animal.Precio_compra as string)) || 0) - aplicaciones.reduce((total, app) => total + (app.Costo || 0), 0)) / (((typeof animal.Precio_compra === 'number' ? animal.Precio_compra : parseFloat(animal.Precio_compra as string)) || 1) + aplicaciones.reduce((total, app) => total + (app.Costo || 0), 0)) * 100).toFixed(1)}%)
                      </span>
                    </>
                  ) : (
                    <>
                      {formatearMoneda(aplicaciones.reduce((total, app) => total + (app.Costo || 0), 0))}
                    </>
                  )}
                </span>
              </div>
              
              {!animal.Precio_venta && (
                <div className="mt-3 text-sm text-gray-500 text-center">
                  💡 El animal aún no ha sido vendido. Registre la venta para ver la ganancia/pérdida final.
                </div>
              )}
            </div>

            {/* ID del documento */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>ID del registro: {animal.$id}</p>
            </div>
          </div>
        </div>

        {/* Sección de Historial de Aplicaciones */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Historial de Productos Aplicados</h2>
              </div>
              <button
                onClick={abrirModalAplicacion}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Aplicación
              </button>
            </div>
          </div>

          <div className="p-6">
            {aplicaciones.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">💉</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No hay aplicaciones registradas para este animal
                </h3>
                <p className="text-gray-500 mb-4">
                  No se encontraron aplicaciones en la tabla AplicacionesAnimal para {animal?.id_animal || animal?.$id}
                </p>
                <div className="text-sm text-gray-400 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Filtros aplicados:</p>
                  <p>• Id: {animal?.id_animal || animal?.$id}</p>
                  <p>• Id_producto: debe estar registrado</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {aplicaciones.map((aplicacion) => {
                  // Obtener detalles del producto
                  const productoDetalles = productos.find(p => p.$id === aplicacion.Id_producto)
                  const nombreProducto = aplicacion.Producto || productoDetalles?.['Nombre'] || 'Producto no especificado'
                  
                  return (
                    <div key={aplicacion.$id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* Nombre del producto */}
                          <div className="flex items-center mb-3">
                            <span className="text-xl mr-3">💊</span>
                            <h4 className="font-semibold text-gray-900 text-base">
                              {nombreProducto}
                            </h4>
                          </div>
                          
                          {/* Información detallada */}
                          <div className="space-y-3">
                            {/* Primera fila: Cantidad, Costo, Fecha */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-600 mr-2">Cantidad:</span>
                                <span className="text-gray-900">{aplicacion.Cantidad || 'No especificada'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-gray-600 mr-2">Costo:</span>
                                <span className="text-gray-900 font-semibold">{formatearMoneda(aplicacion.Costo)}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-gray-600 mr-2">Fecha:</span>
                                <span className="text-gray-900">{formatearFecha(aplicacion.Fecha)}</span>
                              </div>
                            </div>
                            
                            {/* Segunda fila: Motivo completo */}
                            <div className="text-sm">
                              <div className="flex items-start">
                                <span className="font-medium text-gray-600 mr-2 mt-0.5">Motivo:</span>
                                <span className="text-gray-900 flex-1 break-words">
                                  {aplicacion.Motivo || 'No especificado'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => abrirModalEdicionAplicacion(aplicacion)}
                            disabled={loading}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Editar aplicación"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => eliminarAplicacion(aplicacion.$id)}
                            disabled={loading}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar aplicación"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Mensajes de éxito y advertencia */}
    {mensajeExito && (
      <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {mensajeExito}
      </div>
    )}

    {mensajeAdvertencia && (
      <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {mensajeAdvertencia}
      </div>
    )}

    {/* Modal para imagen expandida */}
    {animal && animal.Imagen && imagenExpandida && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 md:p-8 animate-fade-in"
        onClick={toggleImagenExpandida}
      >
        <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); toggleImagenExpandida(); }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-all duration-300 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 transform hover:scale-110 hover:rotate-90"
            aria-label="Cerrar imagen expandida"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={animal.Imagen}
              alt={`Imagen expandida de ${animal.id_animal || 'animal'}`}
              fill
              className="object-contain p-2 sm:p-4 transform transition-all duration-500 hover:scale-105"
              unoptimized
              priority
            />
          </div>
          
          <div className="absolute bottom-4 left-0 right-0 text-center transform transition-all duration-300 hover:scale-105">
            <p className="text-white text-sm sm:text-base bg-black/50 inline-block px-4 py-2 rounded-full shadow-lg border border-white/10 backdrop-blur-sm">
              {animal.id_animal || 'Sin ID'} - {animal.farm_nombre || 'Sin finca'}
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Edición */}
    {modalEdicion && animalEditando && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Editar Animal</h2>
            <button
              onClick={cerrarModalEdicion}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Animal</label>
                <input
                  type="text"
                  value={animalEditando.id_animal || ''}
                  onChange={(e) => manejarCambioCampo('id_animal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Finca</label>
                <select
                  value={animalEditando.farm_id || ''}
                  onChange={(e) => {
                    const selectedFinca = fincas.find(f => f.$id === e.target.value)
                    manejarCambioCampo('farm_id', e.target.value)
                    manejarCambioCampo('farm_nombre', selectedFinca?.nombre || '')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                >
                  <option value="">Seleccione una finca</option>
                  {animalEditando.farm_id && !fincas.some(f => f.$id === animalEditando.farm_id) && (
                    <option value={animalEditando.farm_id}>
                      {animalEditando.farm_nombre || 'Finca no disponible'}
                    </option>
                  )}
                  {fincas.map((finca) => (
                    <option key={finca.$id} value={finca.$id}>
                      {finca.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso de entrada (kg)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={animalEditando.peso_entrada || ''}
                  onChange={(e) => manejarCambioCampo('peso_entrada', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por kg compra</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={animalEditando.precio_kg || ''}
                  onChange={(e) => manejarCambioCampo('precio_kg', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de compra</label>
                <input
                  type="date"
                  value={animalEditando.fecha_compra ? new Date(animalEditando.fecha_compra).toISOString().split('T')[0] : ''}
                  onChange={(e) => manejarCambioCampo('fecha_compra', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio total compra</label>
                <input
                  type="text"
                  value={animalEditando.Precio_compra ? `₡${animalEditando.Precio_compra.toLocaleString('es-CR')}` : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  readOnly
                  title="Calculado automáticamente: Peso entrada × Precio por kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso de salida (kg)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={animalEditando.peso_salida || ''}
                  onChange={(e) => manejarCambioCampo('peso_salida', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por kg venta</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={animalEditando.precio_kg_venta || ''}
                  onChange={(e) => manejarCambioCampo('precio_kg_venta', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de venta</label>
                <input
                  type="date"
                  value={animalEditando.fecha_venta ? new Date(animalEditando.fecha_venta).toISOString().split('T')[0] : ''}
                  onChange={(e) => manejarCambioCampo('fecha_venta', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio total venta</label>
                <input
                  type="text"
                  value={animalEditando.Precio_venta ? `₡${animalEditando.Precio_venta.toLocaleString('es-CR')}` : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  readOnly
                  title="Calculado automáticamente: Peso salida × Precio por kg venta"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={cerrarModalEdicion}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambios}
                disabled={loading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Confirmación de Eliminación */}
    {modalEliminacion && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¿Estás seguro de eliminar este animal?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer. Se eliminará permanentemente el registro de {animal?.id_animal || ''}.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cerrarModalEliminacion}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarAnimal}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Venta */}
    {modalVenta && animalVendiendo && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Registrar Venta</h2>
            <button
              onClick={cerrarModalVenta}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso de salida (kg) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={animalVendiendo.peso_salida || ''}
                  onChange={(e) => manejarCambioVenta('peso_salida', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                  placeholder="Ingrese el peso de salida"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio por kg venta *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={animalVendiendo.precio_kg_venta || ''}
                  onChange={(e) => manejarCambioVenta('precio_kg_venta', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                  placeholder="Ingrese el precio por kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de venta *
                </label>
                <input
                  type="date"
                  value={animalVendiendo.fecha_venta ? new Date(animalVendiendo.fecha_venta).toISOString().split('T')[0] : ''}
                  onChange={(e) => manejarCambioVenta('fecha_venta', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio total venta
                </label>
                <input
                  type="text"
                  value={animalVendiendo.Precio_venta !== undefined ? `₡${animalVendiendo.Precio_venta.toLocaleString('es-CR')}` : '₡0'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold text-gray-900"
                  readOnly
                  title="Calculado automáticamente: Peso salida × Precio por kg venta"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Calculado automáticamente
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={cerrarModalVenta}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarVenta}
                disabled={loading}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrar Venta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Nueva Aplicación */}
    {modalAplicacion && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Nueva Aplicación</h2>
            <button
              onClick={cerrarModalAplicacion}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
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
                  value={convertirFechaAYYYYMMDD(formularioAplicacion.Fecha)}
                  onChange={(e) => manejarCambioAplicacion('Fecha', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={cerrarModalAplicacion}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarAplicacion}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrar Aplicación'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Edición de Aplicación */}
    {modalEdicionAplicacion && aplicacionEditando && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Editar Aplicación</h2>
            <button
              onClick={cerrarModalEdicionAplicacion}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto *
                </label>
                <select
                  value={formularioEdicionAplicacion.Producto}
                  onChange={(e) => manejarCambioEdicionAplicacion('Producto', e.target.value)}
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
                  value={formularioEdicionAplicacion.Cantidad}
                  onChange={(e) => manejarCambioEdicionAplicacion('Cantidad', e.target.value)}
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
                  value={formularioEdicionAplicacion.Costo || ''}
                  onChange={(e) => manejarCambioEdicionAplicacion('Costo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo
                </label>
                <textarea
                  value={formularioEdicionAplicacion.Motivo}
                  onChange={(e) => manejarCambioEdicionAplicacion('Motivo', e.target.value)}
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
                  value={convertirFechaAYYYYMMDD(formularioEdicionAplicacion.Fecha)}
                  onChange={(e) => manejarCambioEdicionAplicacion('Fecha', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={cerrarModalEdicionAplicacion}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicionAplicacion}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Modal de Confirmación de Eliminación de Aplicación */}
    {aplicacionAEliminar && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¿Estás seguro de eliminar esta aplicación?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer. Se eliminará permanentemente el registro de la aplicación.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setAplicacionAEliminar(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarAplicacion}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

  </>
  )
}