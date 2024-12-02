# Phace Med-Spa Website

A modern, performant website for Phace Med-Spa built with Next.js 14.

## Features

- Responsive design for both desktop and mobile
- Fast page loads with Next.js App Router and Server Components
- SEO optimized
- Product storefront
- Treatment information pages
- Team member profiles
- Client testimonials
- Location integration with Google Maps
- (Coming soon) Appointment booking system
- (Coming soon) Staff dashboard

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma (Database ORM)
- PostgreSQL
- NextAuth.js (Authentication)
- Cloudinary (Image management)
- Stripe (Payments)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/                    # App router pages
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   ├── layout/           # Layout components
│   └── sections/         # Page sections
├── lib/                  # Utility functions and configurations
├── styles/               # Global styles
└── types/               # TypeScript types

public/                  # Static assets
prisma/                 # Database schema and migrations
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
