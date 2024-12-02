import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-text/80 mb-6">Sorry, we couldn't find the page you're looking for.</p>
        <Link
          href="/"
          className="bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
