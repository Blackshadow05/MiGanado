'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

export default function MobileNavigation() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)

  // Navigation items for the bottom bar
  const navItems: NavItem[] = [
    {
      name: 'Inicio',
      href: '/',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Ganado',
      href: '/ganado',
      icon: (
        <span className="text-lg">🐄</span>
      )
    },
    {
      name: 'Fincas',
      href: '/finca',
      icon: (
        <span className="text-lg">🌾</span>
      )
    },
    {
      name: 'Productos',
      href: '/productos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    }
  ]

  // Check if current path matches any of the animal detail pages
  const isAnimalDetailPage = pathname?.startsWith('/ganado/') && pathname !== '/ganado'

  // Show navigation on mobile devices and on specific pages
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobile = window.innerWidth < 768 // Tailwind's md breakpoint
      const shouldShow = isMobile && (
        pathname === '/' ||
        pathname === '/ganado' ||
        isAnimalDetailPage ||
        pathname === '/finca' ||
        pathname === '/productos'
      )
      setIsVisible(shouldShow)
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [pathname, isAnimalDetailPage])

  if (!isVisible) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 md:hidden animate-slide-up pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = 
            (item.href === '/' && pathname === '/') ||
            (item.href !== '/' && (pathname?.startsWith(item.href) || 
              (item.href === '/ganado' && isAnimalDetailPage)))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-all duration-200 nav-item-hover
                ${isActive
                  ? 'text-emerald-600 bg-emerald-50 nav-active'
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                }
              `}
            >
              <div className={`mb-1 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] sm:text-xs">{item.name}</span>
            </Link>
          )
        })}
      </div>
      
    </nav>
  )
}