import BrowsLashesNailsHero from "@/components/brows-lashes-nails/BrowsLashesNailsHero";
import BrowsSection from "@/components/brows-lashes-nails/BrowsSection";
import LashesSection from "@/components/brows-lashes-nails/LashesSection";
import NailsSection from "@/components/brows-lashes-nails/NailsSection";
import BookAppointment from "@/components/shared/BookAppointment";

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brows, Lashes & Nails',
  description: 'Brow, lash and nail services at Phace Medical Aesthetics in Chilliwack, BC.',
}

export default function BrowsLashesNailsPage() {
  return (
    <main className="min-h-screen">
      <BrowsLashesNailsHero />
      <BrowsSection />
      <BookAppointment text="Book Appointment" />
      <LashesSection />
      <BookAppointment text="Book Appointment" />
      <NailsSection />
      <BookAppointment text="Book Nail Appointment" />
    </main>
  );
}
