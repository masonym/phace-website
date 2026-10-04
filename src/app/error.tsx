'use client'

import React, { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Keep the details in the console instead of showing them to visitors
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Something went wrong!</h2>
        <p className="text-text/80 mb-6">
          Sorry, this page didn&apos;t load properly. Please try again, or call us at{' '}
          <a href="tel:+17788640624" className="underline">(778) 864-0624</a>.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="border border-accent-soft text-accent px-6 py-2 rounded-full hover:bg-accent/10 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
