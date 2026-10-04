import IVTherapyHero from "@/components/treatments/iv-therapy/IVTherapyHero";
import IVTherapyContent from "@/components/treatments/iv-therapy/IVTherapyContent";

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IV Therapy',
  description: 'Medically guided IV therapy for hydration, recovery and wellness at Phace Medical Aesthetics in Chilliwack, BC.',
}

export default function IVTherapyPage() {
  return (
    <main>
      <IVTherapyHero />
      <IVTherapyContent />
    </main>
  );
}
