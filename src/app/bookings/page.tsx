"use client";
import { useEffect, useState } from "react";

interface Booking {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  appointmentSegments: any[];
}

export default function BookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const response = await fetch('/api/booking/appointments');
        if (!response.ok) throw new Error('failed to fetch');
        const data = await response.json();

        console.log('Bookings response:', data); // debug here

        // Ensure data is an array
        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]); // fallback to empty array if not an array
        }
      } catch (err) {
        setError("failed to load bookings");
        setBookings([]); // fallback to empty array
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  if (loading) return <p>loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Bookings</h2>
      {bookings.length === 0 ? (
        <p>no bookings found.</p>
      ) : (
        <ul className="space-y-4">
          <p>Bookings found: {bookings.length}</p>
          {bookings.map((booking) => (
            <li key={booking.id} className="border p-4 rounded-lg shadow-md">
              <p>
                <strong>ID:</strong> {booking.id}
              </p>
              <p>
                <strong>Start:</strong> {new Date(booking.startAt).toLocaleString()}
              </p>
              <p>
                <strong>End:</strong> {new Date(booking.endAt).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {booking.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
