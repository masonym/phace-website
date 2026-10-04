import { CLINIC, OPENING_HOURS, formatOpeningHours } from '@/lib/config/clinicInfo'

export function ContactInfo() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-[#4A5568] mb-4">Location</h2>
        <p className="text-gray-600">
          {CLINIC.street}
          <br />
          {CLINIC.city}, {CLINIC.province} {CLINIC.postalCode}
        </p>
        <a
          href={CLINIC.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-accent underline hover:text-[#4A5568] transition-colors"
        >
          Get directions
        </a>
      </div>

      <div>
        <h2 className="text-2xl font-light text-[#4A5568] mb-4">Hours</h2>
        <div className="space-y-2 text-gray-600">
          <ul className="space-y-2">
            {OPENING_HOURS.map((hours) => (
              <li key={hours.day}>{formatOpeningHours(hours)}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-light text-[#4A5568] mb-4">Contact</h2>
        <div className="space-y-2">
          <p className="text-gray-600">
            Phone:{' '}
            <a
              href={CLINIC.phoneHref}
              className="text-accent hover:text-[#4A5568] transition-colors"
            >
              {CLINIC.phoneDisplay}
            </a>
          </p>
          <p className="text-gray-600">
            Email:{' '}
            <a
              href={`mailto:${CLINIC.email}`}
              className="text-accent hover:text-[#4A5568] transition-colors"
            >
              {CLINIC.email}
            </a>
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-light text-[#4A5568] mb-4">Map</h2>
        <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-lg">
          <iframe
            title={`Map showing ${CLINIC.name}`}
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${CLINIC.googleMapsPlaceId}`}
            width="600"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}
