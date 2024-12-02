import { ContactForm } from '@/components/contact/ContactForm'
import { ContactInfo } from '@/components/contact/ContactInfo'

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-20 bg-[#FFFBF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-6xl font-light text-[#E4B4A6] mb-16">
          GET IN TOUCH
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <ContactInfo />
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
