import InjectablesHero from "@/components/treatments/injectables/InjectablesHero";
import InjectablesContent from "@/components/treatments/injectables/InjectablesContent";
import BookAppointment from "@/components/shared/BookAppointment";

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Injectables',
  description: 'Neuromodulators and dermal fillers from an experienced naturopathic physician at Phace Medical Aesthetics in Chilliwack, BC.',
}

export default function InjectablesPage() {
  return (
    <main>
      <InjectablesHero />
      <InjectablesContent />
      <BookAppointment />
    </main>
  );
}
