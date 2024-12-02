import Image from 'next/image';
import Link from 'next/link';

export default function FloatingButtons() {
  return (
    <div className="fixed top-32 right-8 z-50 flex flex-row gap-4">
      {/* Book Treatment Button */}
      <Link
        href="/book"
        className="group flex items-center justify-center w-16 h-16 bg-accent hover:bg-accent/90 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Book a Treatment"
      >
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="absolute right-full mr-3 px-2 py-1 bg-black text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Book a Treatment
        </span>
      </Link>

      {/* Finance Button */}
      <Link
        href="https://www.beautifi.com"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-16 h-16 bg-white hover:bg-gray-50 border-2 border-accent text-accent rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Finance with Beautifi"
      >
        <div className="relative w-full h-full p-2">
          <Image
            src="/images/beautifi-logo.webp"
            alt="Beautifi Logo"
            fill
            className="object-contain rounded-full"
          />
        </div>
        <span className="absolute right-full mr-3 px-2 py-1 bg-black text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Finance with Beautifi
        </span>
      </Link>
    </div>
  );
}
