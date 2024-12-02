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
          <h2 className="text-7xl mb-4">Visit Us</h2>
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
            <p>Monday - Saturday: 10am - 4pm</p>
            <p>Sunday: Closed</p>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden shadow-lg">
          <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={15}
            >
              <Marker position={center} />
            </GoogleMap>
          </LoadScript>
        </div>
      </div>
    </section>
  )
}
