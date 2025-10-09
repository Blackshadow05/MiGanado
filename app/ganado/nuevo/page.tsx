'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { databases, storage, DATABASE_ID, GANADO_COLLECTION_ID, FINCA_COLLECTION_ID, BUCKET_ID } from '@/lib/appwrite'
import { ID } from 'appwrite'

interface FormData {
  id_animal: string
  peso_entrada: string
  precio_kg: string
  fecha_compra: string
  Precio_compra: string
  farm_nombre: string
  farm_id: string
  Imagen: string
  imagenFile?: File
}

interface Finca {
  $id: string
  'Nombre-finca': string
  Nombre_apartado?: string
}

export default function NuevoGanadoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    id_animal: '',
    peso_entrada: '',
    precio_kg: '',
    fecha_compra: '',
    Precio_compra: '',
    farm_nombre: '',
    farm_id: '',
    Imagen: '',
    imagenFile: undefined
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fincas, setFincas] = useState<Finca[]>([])
  const [loadingFincas, setLoadingFincas] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    cargarFincas()
  }, [])

  const cargarFincas = async () => {
    try {
      setLoadingFincas(true)
      const response = await databases.listDocuments(
        DATABASE_ID,
        FINCA_COLLECTION_ID
      )
      setFincas(response.documents as unknown as Finca[])
    } catch (err) {
      console.error('Error al cargar fincas:', err)
      setError('Error al cargar las fincas disponibles')
    } finally {
      setLoadingFincas(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'finca') {
      // Cuando se selecciona una finca, obtener el ID y el nombre
      const fincaSeleccionada = fincas.find(f => f.$id === value)
      if (fincaSeleccionada) {
        setFormData(prev => ({
          ...prev,
          farm_id: fincaSeleccionada.$id,
          farm_nombre: fincaSeleccionada['Nombre-finca']
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calcular nuevas dimensiones (máximo 1600px en el lado más largo)
        const MAX_SIZE = 1600
        let width = img.width
        let height = img.height
        
        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width)
          width = MAX_SIZE
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height)
          height = MAX_SIZE
        }
        
        // Configurar canvas con nuevas dimensiones
        canvas.width = width
        canvas.height = height
        
        // Dibujar imagen comprimida
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convertir a blob con calidad 0.8 (WebP mantiene mejor calidad a la misma compresión)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Cambiar extensión del archivo a .webp
              const webpFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
              const compressedFile = new File([blob], webpFileName, {
                type: 'image/webp',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Error al comprimir la imagen'))
            }
          },
          'image/webp',
          0.8
        )
      }
      
      img.onerror = () => reject(new Error('Error al cargar la imagen'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return
    
    setUploadingImage(true)
    try {
      // Comprimir imagen y guardar temporalmente (no subir aún)
      const compressedFile = await compressImage(file)
      
      // Crear URL temporal para vista previa
      const previewUrl = URL.createObjectURL(compressedFile)
      
      setFormData(prev => ({
        ...prev,
        Imagen: previewUrl,
        imagenFile: compressedFile
      }))
    } catch (err) {
      console.error('Error al procesar imagen:', err)
      setError('Error al procesar la imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  const uploadImageToAppwrite = async (file: File): Promise<string> => {
    const response = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file
    )
    
    // Obtener la URL de la imagen (usar getFileView para evitar transformaciones)
    const imageUrl = storage.getFileView(BUCKET_ID, response.$id)
    return imageUrl.toString()
  }

  const handleCameraCapture = () => {
    // Crear un input de tipo file con capture=camera
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'camera'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleImageUpload(file)
      }
    }
    
    input.click()
  }

  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validar campos requeridos
      if (!formData.id_animal || !formData.peso_entrada || !formData.precio_kg || !formData.fecha_compra || !formData.farm_id) {
        throw new Error('Por favor complete todos los campos requeridos')
      }

      let imagenUrlFinal = formData.Imagen || ''

      // Subir imagen a Appwrite si hay una imagen seleccionada
      if (formData.imagenFile) {
        imagenUrlFinal = await uploadImageToAppwrite(formData.imagenFile)
      }

      // Calcular precio total de compra
      const pesoEntrada = parseFloat(formData.peso_entrada)
      const precioKg = parseFloat(formData.precio_kg)
      const precioCompra = pesoEntrada * precioKg

      // Crear el documento en Appwrite
      await databases.createDocument(
        DATABASE_ID,
        GANADO_COLLECTION_ID,
        ID.unique(),
        {
          id_animal: formData.id_animal,
          peso_entrada: pesoEntrada,
          precio_kg: precioKg,
          fecha_compra: formData.fecha_compra,
          Precio_compra: precioCompra.toString(),
          farm_nombre: formData.farm_nombre,
          farm_id: formData.farm_id || 'pendiente',
          Imagen: imagenUrlFinal
        }
      )

      // Limpiar URL temporal si existe
      if (formData.Imagen && formData.Imagen.startsWith('blob:')) {
        URL.revokeObjectURL(formData.Imagen)
      }

      // Redirigir a la lista de ganado con éxito
      router.push('/ganado?nuevo=registrado')
    } catch (err) {
      console.error('Error al registrar animal:', err)
      setError(err instanceof Error ? err.message : 'Error al registrar el animal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center text-gray-700 hover:text-emerald-600 transition-all duration-300 transform hover:scale-105 mb-6"
          >
            <div className="mr-2 p-2 rounded-full bg-white shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="font-medium">Volver</span>
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Registrar Nuevo Animal
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-3">
              Complete los datos del nuevo animal
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
            {/* ID del Animal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID del Animal *
              </label>
              <input
                type="text"
                name="id_animal"
                value={formData.id_animal}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 bg-white"
                placeholder="Ej: ANI-001"
                required
              />
            </div>

            {/* Peso de Entrada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso de Entrada (kg) *
              </label>
              <input
                type="number"
                name="peso_entrada"
                value={formData.peso_entrada}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 bg-white"
                placeholder="Ej: 350"
                min="0"
                step="0.1"
                required
              />
            </div>

            {/* Precio por kg */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio por kg (₡) *
              </label>
              <input
                type="number"
                name="precio_kg"
                value={formData.precio_kg}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 bg-white"
                placeholder="Ej: 850"
                min="0"
                step="1"
                required
              />
            </div>

            {/* Fecha de Compra */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Compra *
              </label>
              <input
                type="date"
                name="fecha_compra"
                value={formData.fecha_compra}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 bg-white"
                required
              />
            </div>

            {/* Precio de Compra (Calculado) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Compra (₡)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="Precio_compra"
                  value={formData.peso_entrada && formData.precio_kg
                    ? (parseFloat(formData.peso_entrada) * parseFloat(formData.precio_kg)).toFixed(2)
                    : '0.00'
                  }
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Calculado automáticamente: Peso × Precio por kg
              </p>
            </div>

            {/* Finca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finca *
              </label>
              {loadingFincas ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Cargando fincas...
                </div>
              ) : fincas.length === 0 ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-yellow-50 text-yellow-700">
                  No hay fincas registradas.
                  <button
                    type="button"
                    onClick={() => router.push('/finca/nuevo')}
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    Registrar una nueva finca
                  </button>
                </div>
              ) : (
                <select
                  name="finca"
                  value={formData.farm_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-gray-900 bg-white"
                  required
                >
                  <option value="">Seleccione una finca</option>
                  {fincas.map((finca) => (
                    <option key={finca.$id} value={finca.$id}>
                      {finca['Nombre-finca']} {finca.Nombre_apartado ? `- ${finca.Nombre_apartado}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Subida de Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Imagen del Animal
              </label>
              
              {/* Vista previa de la imagen */}
              {formData.Imagen && (
                <div className="mb-4">
                  <img
                    src={formData.Imagen}
                    alt="Vista previa"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-emerald-200"
                  />
                </div>
              )}
              
              <div className="flex space-x-4">
                {/* Botón para abrir cámara */}
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  disabled={uploadingImage}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {uploadingImage ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  <span>{uploadingImage ? 'Subiendo...' : 'Tomar Foto'}</span>
                </button>

                {/* Botón para abrir galería */}
                <button
                  type="button"
                  onClick={handleGallerySelect}
                  disabled={uploadingImage}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {uploadingImage ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span>{uploadingImage ? 'Subiendo...' : 'Abrir Galería'}</span>
                </button>
              </div>

              {/* Input de archivo oculto */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <p className="text-xs text-gray-500 mt-2">
                Opcional: Agregue una foto del animal para identificarlo mejor
              </p>
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
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md flex items-center space-x-2"
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
                    <span>Registrar Animal</span>
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