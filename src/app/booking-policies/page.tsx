"use client";
import React from "react";
import Link from "next/link";

export default function BookingPoliciesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl mt-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h1 className="text-4xl font-light text-[var(--primary)] mb-4">
            BOOKING<br />POLICY
          </h1>
        </div>

        <div className="md:col-span-2 flex flex-col gap-6">
          <section className="border-b border-[var(--primary)] pb-6">
            <h2 className="text-xl font-light text-[var(--accent)] uppercase mb-4">
              BOOKING
            </h2>
            <p className="text-[var(--text)]">
              A credit card is required to book and hold your appointment time, however
              you will not be charged at that time.
            </p>
          </section>

          <section className="border-b border-[var(--primary)] pb-6">
            <h2 className="text-xl font-light text-[var(--accent)] uppercase mb-4">
              RESCHEDULE/CANCEL
            </h2>
            <p className="text-[var(--text)] mb-4">
              Please notify us at least 24 hours prior to your appointment, should you
              need to cancel or reschedule your appointment.
            </p>
            <p className="text-[var(--text)]">
              Appointments cancelled or rescheduled with less than 24 hours notice from
              the start of your appointment time are subject to a charge of 50% of your
              service fee.
            </p>
          </section>

          <section className="border-b border-[var(--primary)] pb-6">
            <h2 className="text-xl font-light text-[var(--accent)] uppercase mb-4">
              LATE
            </h2>
            <p className="text-[var(--text)] mb-4">
              We appreciate if you notify us when you will be late to your appointment.
              We have a 15 minute grace period but cannot guarantee the completion of
              your full service in the time remaining. In such cases, there will be no refund
              for missed time or shortened service.
            </p>
            <p className="text-[var(--text)]">
              After 15 minutes we will need to cancel or reschedule your appointment and
              this will incur our standard charge/late cancel fee of 50% of your service
              price.
            </p>
          </section>

          <section className="border-b border-[var(--primary)] pb-6">
            <h2 className="text-xl font-light text-[var(--accent)] uppercase mb-4">
              NO SHOWS
            </h2>
            <p className="text-[var(--text)]">
              No shows/missed appointments will be charged 100% of your service fee.
            </p>
          </section>

          <div className="text-center py-8 text-[var(--accent)]">
            <p>
              These policies are strictly enforced in order to respect our clients time and our
              practitioners time. Thank you for your understanding.
            </p>
          </div>

          <div className="text-center">
            <Link href="/book" className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-full hover:opacity-90 transition-opacity">
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
