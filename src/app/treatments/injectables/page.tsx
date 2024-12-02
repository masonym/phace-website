import InjectablesHero from "@/components/treatments/injectables/InjectablesHero";
import InjectablesContent from "@/components/treatments/injectables/InjectablesContent";
import BookAppointment from "@/components/shared/BookAppointment";

export default function InjectablesPage() {
  return (
    <main>
      <InjectablesHero />
      <InjectablesContent />
      <BookAppointment />
    </main>
  );
}
