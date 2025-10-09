'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const router = useRouter()

  const cards = [
    {
      id: 'ganado',
      title: 'Gestión de Ganado',
      description: 'Administra y controla todo tu inventario de ganado',
      icon: '🐄',
      color: 'from-green-400 to-emerald-600',
      hoverColor: 'from-green-500 to-emerald-700'
    },
    {
      id: 'finca',
      title: 'Finca',
      description: 'Gestiona las propiedades y terrenos de tu finca',
      icon: '🏡',
      color: 'from-blue-400 to-cyan-600',
      hoverColor: 'from-blue-500 to-cyan-700'
    },
    {
      id: 'productos',
      title: 'Productos',
      description: 'Controla productos y servicios relacionados con el ganado',
      icon: '🥛',
      color: 'from-orange-400 to-red-600',
      hoverColor: 'from-orange-500 to-red-700'
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Sistema de Control Ganadero
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Herramienta integral para la gestión y control de tu operación ganadera
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`relative group cursor-pointer transition-all duration-300 transform ${
                hoveredCard === card.id ? 'scale-105' : 'scale-100'
              }`}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Card */}
              <div className={`
                relative overflow-hidden rounded-2xl shadow-lg
                bg-gradient-to-br ${card.color}
                p-8 h-64 flex flex-col justify-between
                transition-all duration-300
                group-hover:shadow-2xl
              `}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 text-6xl opacity-20">
                    {card.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-4xl mb-4">{card.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Hover Effect */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br ${card.hoverColor}
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  rounded-2xl
                `} />

                {/* Button */}
                <div className="relative z-10 mt-4">
                  <button
                    onClick={() => {
                      if (card.id === 'ganado') {
                        router.push('/ganado')
                      } else if (card.id === 'finca') {
                        router.push('/finca')
                      } else if (card.id === 'productos') {
                        router.push('/productos')
                      }
                    }}
                    className="
                      bg-white/20 backdrop-blur-sm
                      text-white font-semibold
                      px-6 py-2 rounded-full
                      border border-white/30
                      transition-all duration-300
                      hover:bg-white/30 hover:scale-105
                      transform
                    "
                  >
                    Acceder
                  </button>
                </div>
              </div>

              {/* Glow Effect */}
              <div className={`
                absolute -inset-2 bg-gradient-to-r ${card.color}
                rounded-2xl blur-xl opacity-0 group-hover:opacity-30
                transition-opacity duration-300 -z-10
              `} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Sistema desarrollado para optimizar la gestión ganadera
          </p>
        </div>
      </div>
    </div>
  )
}