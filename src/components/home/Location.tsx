import { CLINIC, OPENING_HOURS, formatOpeningHours } from '@/lib/config/clinicInfo'

export function Location() {
  return (
    <section className="py-20 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl">Visit Us</h2>
          <p className="text-lg mb-2">
            Join us at our beautiful location in the historic river-valley town of Yarrow, in Chilliwack, BC.
          </p>
          <address className="not-italic">
            <p className="text-lg font-medium">{CLINIC.street}</p>
            <p>{CLINIC.city}, {CLINIC.province} {CLINIC.postalCode}</p>
            <p className="mt-2">
              <a
                href={CLINIC.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Get directions
              </a>
            </p>
            <p className="mt-4">
              <a href={CLINIC.phoneHref} className="text-accent hover:underline">
                {CLINIC.phoneDisplay}
              </a>
            </p>
            <p>
              <a href={`mailto:${CLINIC.email}`} className="text-accent hover:underline">
                {CLINIC.email}
              </a>
            </p>
          </address>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-2">OPEN HOURS</h3>
            <ul className="space-y-2">
              {OPENING_HOURS.map((hours) => (
                <li key={hours.day}>{formatOpeningHours(hours)}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden shadow-lg">
          <iframe
            title={`Map showing ${CLINIC.name}`}
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:${CLINIC.googleMapsPlaceId}`}
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        </div>
      </div>
    </section>
  )
}
