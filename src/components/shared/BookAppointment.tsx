import Link from "next/link";

interface BookAppointmentProps {
  text?: string;
  link?: string;
}

export default function BookAppointment({ 
  text = "Book Appointment",
  link = "/book"
}: BookAppointmentProps) {
  return (
    <div className="py-12 bg-beige-100">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <Link 
          href={link}
          className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-slate-800 hover:bg-slate-700 hover:scale-105 rounded-md transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
        >
          {text} →
        </Link>
      </div>
    </div>
  );
}
