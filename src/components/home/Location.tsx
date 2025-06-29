'use client'

import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'

const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

const center = {
  lat: 49.1329, // Yarrow, Chilliwack coordinates
  lng: -122.0841
}

export function Location() {
  return (
    <section className="py-20 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-6xl">Visit Us</h2>
          <p className="text-lg mb-2">
            Join us at our beautiful location in the historic river-valley town of Yarrow, in Chilliwack, BC.
          </p>
          <address className="not-italic">
            <p className="text-lg font-medium">42333 Yarrow Central Rd</p>
            <p>Chilliwack, BC V2R 5E1</p>
            <p className="mt-4">
              <a href="tel:+17788640624" className="text-accent hover:underline">
                (778) 864-0624
              </a>
            </p>
            <p>
              <a href="mailto:hello@phace.ca" className="text-accent hover:underline">
                hello@phace.ca
              </a>
            </p>
          </address>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-2">OPEN HOURS</h3>
            <ul className="space-y-2">
              <li>Monday: Closed</li>
              <li>Tuesday: 10 AM - 7 PM</li>
              <li>Wednesday: 10 AM - 4 PM</li>
              <li>Thursday: 10 AM - 7 PM</li>
              <li>Friday: 10 AM - 4 PM</li>
              <li>Saturday: 10 AM - 2 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden shadow-lg">
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=place_id:ChIJwQQwelhHhFQRnUFtj2tusQ4`}
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
