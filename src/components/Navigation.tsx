'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { CartButton } from './cart/CartButton';

const NAV_LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/about', label: 'ABOUT' },
  { href: '/treatments', label: 'TREATMENTS' },
  { href: '/contact', label: 'CONTACT' },
  { href: '/store', label: 'SHOP ONLINE' },
]

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  // The admin section has its own header/layout, so hide the marketing nav there.
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || !!pathname?.startsWith(`${href}/`)

  return (
    <nav className="fixed w-full bg-[#FDECC2]/80 backdrop-blur-sm z-50" aria-label="Main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex-shrink-0 text-2xl font-bold">
            <Image
              src="/images/logo.webp"
              alt="Phace Medical Aesthetics home"
              width={128}
              height={128}
              className="object-cover"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={`transition-colors hover:text-accent ${isActive(href) ? 'text-accent border-b-2 border-accent' : 'text-text'}`}
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/book"
                className="bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-colors"
              >
                BOOK NOW
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CartButton />
            {isAuthenticated ? (
              <Link href="/profile" className="text-text hover:text-accent transition-colors">
                Profile
              </Link>
            ) : (
              <Link href="/login" className="text-text hover:text-accent transition-colors">
                Log In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-text hover:text-accent"
            >
              <span className="sr-only">{isMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={`block px-3 py-2 transition-colors hover:text-accent ${isActive(href) ? 'text-accent font-semibold' : 'text-text'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/book"
                className="block px-3 py-2 bg-accent text-white rounded-full hover:bg-accent/90 transition-colors text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                BOOK NOW
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
