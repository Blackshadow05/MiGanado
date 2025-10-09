'use client'

import { useRouter } from 'next/navigation'

interface Finca {
  $id: string
  $createdAt?: string
  createdAt?: string
  $created_at?: string
  'Nombre-finca'?: string
  Nombre_apartado?: string
  [key: string]: any
}

interface FincaCardProps {
  finca: Finca
  onClick: () => void
}

export default function FincaCard({ finca, onClick }: FincaCardProps) {
  const router = useRouter()

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'No disponible'
    return new Date(fecha).toLocaleDateString('es-ES')
  }

  // Función para obtener la fecha correcta (manejar $createdAt o createdAt)
  const obtenerFecha = (finca: Finca) => {
    return finca.$createdAt || finca.createdAt || finca.$created_at
  }

  return (
    <div
      key={finca.$id}
      onClick={() => onClick()}
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden cursor-pointer"
    >
      {/* Efecto de brillo superior */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-400"></div>

      {/* Header con gradiente */}
      <div className="relative overflow-hidden p-6 bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                {finca['Nombre-finca'] || 'Sin nombre'}
              </h3>
              <p className="text-white/80 text-base truncate">
                {finca.Nombre_apartado || 'Sin apartado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
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

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-sm">🏷️</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">ID del registro</p>
              <p className="font-semibold text-gray-800 truncate">
                {finca.$id}
              </p>
            </div>
          </div>
        </div>

        {/* Indicador visual */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm font-medium text-gray-600">
              Click para ver detalles
            </span>
            <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  )
}