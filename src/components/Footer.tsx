import React from 'react'
import Link from 'next/link'

export function Footer() {
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
              <li><Link href="/shop" className="hover:text-accent">SHOP</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">OUR ADDRESS</h3>
            <address className="not-italic">
              <p>42333 Yarrow Central Rd</p>
              <p>Chilliwack</p>
              <p>BC V2R 5E1</p>
            </address>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">OPEN HOURS</h3>
            <p>Mon - Sat: 10am - 4pm</p>
            <p>Sunday: Closed</p>
            <div className="mt-4">
              <p><a href="tel:+17788640624" className="hover:text-accent">(778) 864-0624</a></p>
              <p><a href="mailto:hello@phace.ca" className="hover:text-accent">hello@phace.ca</a></p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">DON'T MISS AN UPDATE</h3>
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-2 rounded-full bg-white/50 border border-accent/20 focus:outline-none focus:border-accent"
              />
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-accent" />
                <span className="text-sm">Yes, subscribe me to your newsletter.</span>
              </label>
              <button
                type="submit"
                className="w-full bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-accent/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Phace. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="hover:text-accent">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-accent">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
