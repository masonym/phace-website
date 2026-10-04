'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CLINIC, OPENING_HOURS, formatOpeningHours } from '@/lib/config/clinicInfo'

function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setStatus('success')
      setEmail('')
      setConsent(false)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return <p role="status">Thanks for signing up! Watch your inbox for news and offers from Phace.</p>
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email Address"
        className="w-full px-4 py-2 rounded-full bg-white/50 border border-accent/20 focus:outline-none focus:border-accent"
      />
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="rounded text-accent"
        />
        <span className="text-sm">Yes, subscribe me to your newsletter.</span>
      </label>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-colors disabled:opacity-70"
      >
        {status === 'loading' ? 'Signing up...' : 'Submit'}
      </button>
      {status === 'error' && (
        <p role="alert" className="text-sm text-red-700">{message}</p>
      )}
    </form>
  )
}

export function Footer() {
  const pathname = usePathname()

  // The admin section has its own layout, so hide the marketing footer there.
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="bg-secondary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">MENU</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-accent">HOME</Link></li>
              <li><Link href="/about" className="hover:text-accent">ABOUT</Link></li>
              <li><Link href="/treatments" className="hover:text-accent">TREATMENTS</Link></li>
              <li><Link href="/store" className="hover:text-accent">SHOP</Link></li>
              <li><Link href="/contact" className="hover:text-accent">CONTACT</Link></li>
              <li><Link href="/book" className="hover:text-accent font-medium">BOOK NOW</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">OUR ADDRESS</h3>
            <address className="not-italic">
              <p>{CLINIC.street}</p>
              <p>{CLINIC.city}</p>
              <p>{CLINIC.province} {CLINIC.postalCode}</p>
            </address>
            <a
              href={CLINIC.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 underline hover:text-accent"
            >
              Get directions
            </a>
            <p className="mt-4">
              <a
                href="https://instagram.com/phace.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                Instagram: @phace.ca
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">OPEN HOURS</h3>
            <ul className="space-y-2">
              {OPENING_HOURS.map((hours) => (
                <li key={hours.day}>{formatOpeningHours(hours)}</li>
              ))}
            </ul>
            <div className="mt-4">
              <p><a href={CLINIC.phoneHref} className="hover:text-accent">{CLINIC.phoneDisplay}</a></p>
              <p><a href={`mailto:${CLINIC.email}`} className="hover:text-accent">{CLINIC.email}</a></p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">DON&apos;T MISS AN UPDATE</h3>
            <NewsletterSignup />
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-accent/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Phace. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/booking-policy" className="hover:text-accent">Booking Policy</Link>
              <Link href="/shipping-policy" className="hover:text-accent">Shipping Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
