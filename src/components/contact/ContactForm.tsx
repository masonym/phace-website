"use client"

import { useState } from 'react'

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setStatus('success')
      setFormData({ name: '', email: '', phone: '', message: '' })

      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle')
      }, 5000)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={status === 'loading'}
          className="mt-1 p-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#E4B4A6] focus:ring-[#E4B4A6] sm:text-sm disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={status === 'loading'}
          className="mt-1 p-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#E4B4A6] focus:ring-[#E4B4A6] sm:text-sm disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={status === 'loading'}
          className="mt-1 p-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#E4B4A6] focus:ring-[#E4B4A6] sm:text-sm disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          required
          disabled={status === 'loading'}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#E4B4A6] focus:ring-[#E4B4A6] sm:text-sm disabled:opacity-50"
        />
      </div>

      {status === 'error' && (
        <div className="text-red-600 text-sm">{errorMessage}</div>
      )}

      {status === 'success' && (
        <div className="text-green-600 text-sm">Message sent successfully!</div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-[#E4B4A6] text-white py-2 px-4 rounded-md hover:bg-[#E4B4A6]/90 focus:outline-none focus:ring-2 focus:ring-[#E4B4A6] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
