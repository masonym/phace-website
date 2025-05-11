"use client";
import React from "react";
import Link from "next/link";

export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl mt-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h1 className="text-4xl font-light text-[var(--primary)] mb-4">
            SHIPPING<br />POLICY
          </h1>
        </div>

        <div className="md:col-span-2 flex flex-col gap-6">
          <section className="border-b border-[var(--primary)] pb-6">
            <h2 className="text-xl font-light text-[var(--accent)] uppercase mb-4">
              SHIPPING
            </h2>
            <p className="text-[var(--text)] mb-4">
              Our shipping policy ensures that your order is processed and shipped promptly. Once your order is confirmed, we will
              provide you with a tracking number via email or SMS, allowing you to monitor the status of your package. Please note that
              shipping costs may vary depending on your location and the size of your order. We partner with reliable shipping carriers to
              ensure timely delivery, but shipping times may vary. For any inquiries about your shipment or to track your order, please
              reach out to hello@phace.ca.
            </p>
            <p className="text-[var(--text)]">
              Thank you for shopping with Phace, we appreciate your business!
            </p>
          </section>

          <div className="text-center py-8">
            <Link href="/store" className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-full hover:opacity-90 transition-opacity">
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
