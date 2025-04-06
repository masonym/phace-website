# Phace Medical Aesthetics

> A full-stack booking and e-commerce website for a small business in the medical aesthetics industry, located in Chilliwack, British Columbia. Designed to replace a Wix website and acuity scheduling paltform. Built to extend the limitations of off-the-shelf booking tools by building a fully customized frontend integrated with the Square API.

## Overview

This platform was built to support a medical spa’s online presence, appointment booking, and retail product sales. It integrates deeply with Square’s API to provide users with a seamless experience for browsing services, customizing appointments with add-ons, and securely submitting payment info—all tied into the spa’s POS system. The aim here is to create a holistic experience for users, allowing them to book appointments and purchase products in a single flow, while also providing the spa with a modern, responsive website that reflects their brand identity.

The platform is designed to match the brand’s aesthetic while offering full mobile responsiveness, modern UX, and performance optimizations.

## Features

### 💆‍♀️ Custom Appointment Booking Flow
Users can browse available services and select appointment slots directly through a custom UI that integrates with Square’s Appointments API. Add-on support is implemented manually, allowing a more detailed selection process than what Square supports natively.

### 🛍️ Integrated E-Commerce Storefront
Connects to the spa’s Square-hosted product catalog to allow online purchases of beauty and skincare products, with a full-featured shopping cart and checkout flow powered by Square’s Web Payments SDK.

### 🔐 Secure Payment Handling
All card tokenization is handled via Square’s client-side SDK, ensuring PCI compliance and secure handling of user credit card data.

### 🌐 SEO & Performance Optimizations
Built on Next.js App Router with server-rendered pages, fast route transitions, and CDN-backed static assets to optimize performance and SEO.

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS  
- **Backend**: Square Appointments + Web Payments APIs  
- **Deployment**: Vercel  
- **Infra/Integration**: Square API, Vercel Edge Functions

## Key Engineering Challenges

- 🟦 **Strict Square Requirement**
  The client had a strict requirement to use Square for payment processing and appointment management, which limited the options for building a custom solution. This required deep integration with Square’s APIs and careful consideration of their limitations.

- 🧩 **Add-On Support Hacked into Square Booking Flow**  
  Square doesn’t support add-on selections natively during booking—custom state management and API manipulation were required to simulate that behavior.

- ⌚ **Recently Updated SDK**  
  Square’s Web Payments SDK was recently updated, requiring a full re-implementation of the checkout flow to accommodate breaking changes. This was a significant challenge as the new SDK has very few (or no examples); however the documentation is excellent. This was great practice for learning to read and understand documentation. Utilizing TypeScript for this project also helped to identify many of the breaking changes before they became issues in the codebase.

- 📦 **Custom Product Catalog**
   The way Square manages products and services is quite different from how I expected (or would have made myself), and I got an opportunity to learn about Union Typing in TypeScript. 

## Status

Project is currently in late-stage development and expected to go live in Q2 2025.

## License

Private client project. Not open source.
