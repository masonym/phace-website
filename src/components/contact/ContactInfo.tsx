export function ContactInfo() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light text-[#4A5568] mb-4">Location</h2>
        <p className="text-gray-600">
          42333 Yarrow Central Rd
          <br />
          Chilliwack, BC V2R 5E1
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-light text-[#4A5568] mb-4">Hours</h2>
        <div className="space-y-2 text-gray-600">
          <p>Monday - Saturday: 10:00 AM - 4:00 PM</p>
          <p>Sunday: Closed</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-light text-[#4A5568] mb-4">Contact</h2>
        <div className="space-y-2">
          <p className="text-gray-600">
            Phone:{' '}
            <a
              href="tel:+16047033552"
              className="text-[#E4B4A6] hover:text-[#4A5568] transition-colors"
            >
              (778) 864-0624
            </a>
          </p>
          <p className="text-gray-600">
            Email:{' '}
            <a
              href="mailto:hello@phace.ca"
              className="text-[#E4B4A6] hover:text-[#4A5568] transition-colors"
            >
              hello@phace.ca
            </a>
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-light text-[#4A5568] mb-4">Map</h2>
        <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-lg">
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=PHACE+Medical+Aesthetics,+Skincare+%26+Spa`}
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
