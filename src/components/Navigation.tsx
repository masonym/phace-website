'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed w-full bg-[#FFFBF0]/80 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex-shrink-0 text-2xl font-bold">
            <Image
              src="/images/logo.webp"
              alt="Logo"
              width={128}
              height={128}
              className="object-cover"
            />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-text hover:text-accent transition-colors">
                HOME
              </Link>
              <Link href="/about" className="text-text hover:text-accent transition-colors">
                ABOUT
              </Link>
              <Link href="/treatments" className="text-text hover:text-accent transition-colors">
                TREATMENTS
              </Link>
              <Link href="/contact" className="text-text hover:text-accent transition-colors">
                CONTACT
              </Link>
              <Link
                href="/book"
                className="bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-colors"
              >
                BOOK NOW
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-text hover:text-accent"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-text hover:text-accent transition-colors">
              Log In
            </Link>
            {/* <Link
              href="/book"
              className="bg-accent text-white px-4 py-2 rounded-full hover:bg-accent/90 transition-colors"
            >
              Book Now
            </Link> */}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/"
                className="block px-3 py-2 text-text hover:text-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                HOME
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-text hover:text-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                ABOUT
              </Link>
              <Link
                href="/treatments"
                className="block px-3 py-2 text-text hover:text-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                TREATMENTS
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-text hover:text-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                CONTACT
              </Link>
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
