TODO:

## SITE REVIEW (2026-10-03)

### 0. Security / money
- [x] S1. square-payment trusts client-sent `discount.discountAmount` -- recompute coupon + B2G1 server-side
- [x] S2. coupon/create + coupon/list have no auth
- [x] S3. discount/create only checks a "Bearer " prefix exists, never verifies
- [x] S4. upload-url has no auth (no callers in the app)
- [x] S5. booking/staff/blocked-time POST/DELETE have no auth
- [x] S6. Upgrade Next 14.0.0 -> latest 14.2.x (CVE-2025-29927 middleware bypass)
- [x] S7. (follow-up) other admin routes only check "valid Cognito token", but customers share the same user pool -- should also check the admin table

### 1. Presale popup (live Oct 6)
- [x] P1. Don't show on /book, /checkout, /booking-confirmed, /login etc.
- [x] P2. Close on backdrop click

### 2. Booking flow
- [x] B1. Explain card on ClientForm ("won't be charged now") + link booking policy
- [x] B2. Confirm Booking button contrast (white on #DEC3C5) + undefined hover:bg-primary-dark
- [x] B3. Show cancellation policy on summary
- [x] B4. Consent step: auto-skip when no forms; error state needs retry + back
- [x] B5. Browser back leaves the flow (router.replace); refresh mid-flow breaks (blank addons step)
- [x] B6. Back from staff lands on single-option "variation" screen
- [x] B7. Addon selection + selected date lost on Back
- [x] B8. "Any available provider" option; auto-skip staff step when only one provider
- [x] B9. Calendar: jump to first available date; bound month arrows; aria-labels; legend for orange (fully booked)
- [x] B10. Waitlist prompt repeated in every state -- show once
- [x] B11. Format slot times in America/Vancouver, not browser tz
- [ ] B12. (needs answer from Dawn) Same-day booking excluded -- intentional? (ask Dawn)
- [x] B13. Confirmation page: add-to-calendar, address/directions, policy
- [x] B14. Category/service cards are clickable divs -> buttons
- [x] B15. Service search across all categories on the first booking step

### 3. Store & checkout
- [x] C1. Payment succeeds but /api/orders fails -> user sees error, may pay twice
- [x] C2. Pickup still requires full shipping address
- [x] C3. Success page: order number/summary; pickup-aware copy
- [x] C4. Checkout inputs: labels + autoComplete
- [x] C5. ProductGrid sidebar class string mangled (`lg: w - 1 / 5 ...`)
- [x] C6. ProductGrid layout via windowWidth state -> CSS breakpoints (layout flash)
- [x] C7. Store search, sort, filters in URL, empty state
- [x] C8. Brand vs type detection: a "Brands" parent category in Square now wins; name list kept as fallback (storeConfig)

### 4. Accounts
- [x] A1. Profile "My Appointments" broken (GET ignores clientEmail, hardcoded 2025 date range)
- [x] A2. Remove/protect /bookings and /test-gift-card debug pages

### 5. Visual / a11y
- [x] V1. Spinnaker font never loads (@font-face src commented out) -> next/font
- [x] V2. .section-title clamp(5rem, 4vw, 3rem) is always 80px
- [ ] V3.  (brand colour decision -- confirm button now uses accent; headings/accent still low contrast) Contrast: #DEC3C5/#E4B4A6 headings on cream (~1.5:1), white on accent (~2.9:1)
- [x] V4. Mobile menu aria-expanded, active nav link, logo alt, map iframe title, testimonial alt text
- [x] V5. error.tsx shows raw error.message

### 6. SEO / performance
- [x] O1. Per-page metadata (titles/descriptions) incl. treatment pages
- [x] O2. sitemap.ts + robots.ts
- [x] O3. LocalBusiness / MedicalBusiness JSON-LD
- [x] O4. phace-outside.webp is 6.5MB (images unoptimized)
- [x] O5. Product pages: server-side title/description/canonical, readable slug URLs, products in sitemap (page body still client-rendered)

### Found while fixing
- [x] F1. Contact page phone link dialed +1 604 703 3552 while showing (778) 864-0624
- [x] F2. Consent-form validation error replaced the whole form with red text
- [x] F3. GET /api/booking/appointments/[id] returned notes + consent answers publicly
- [x] F4. Coupon usage never counted (applyCoupon never called) -> usage limits not enforced
- [x] F5. Contact form email inserted name/message as raw HTML
- [x] F6. Checkout total didn't refresh after applying a coupon (charge != displayed total)
- [ ] F7. Set NEXT_PUBLIC_SITE_URL in Vercel (defaults to https://phace.ca -- confirm domain)
- [x] F9. Missing /images/placeholder.png -> products without photos showed a broken image
- [x] F10. API test suites were broken (square mock lacked SquareEnvironment); rewritten + discount tests added
- [ ] F8. Newsletter signups are emailed to hello@phace.ca -- move to a real list (Square Marketing / Mailchimp) later

### 7. Content / nav
- [x] N1. Footer newsletter form does nothing
- [x] N2. Footer: Book, Contact, FAQ, Instagram, Google reviews links
- [x] N3. Hours duplicated in Footer, Location, Contact -> single source
- [ ] N4.  (partial: benefits + duration shown; prices in data/treatments.ts not shown until confirmed current) Treatment pages: show price/duration/benefits already in data
- [x] N5. Deep-link (/book?category=<keyword>, matched against live category names; falls back to the list) -- "Book" buttons to the right category
- [ ] N6.  (Laser fixed -> /treatments/sharplight; Scar Revision has no page yet) Home: Laser "Learn more" goes to /treatments; Scar Revision has no link
- [x] N7. FAQ page (/faq, only facts already on the site, with FAQPage JSON-LD)

## Booking Flow Square Integration 

- [x] 8. Need to make sure certain categories don't show up in the booking flow step 1 (Addons, Gift Cards, etc) -- i think we can do this with some stuff related to top-level categories
- [ ] 14. Consent forms are broken
- [ ] 15. Waitlist doesn't work -- can i just link to teh square waitlist form instead of managing it myself?


## Square Shop Integration

- [ ] 15. Add to Cart vs Buy Now option (what does this do?) // ADD TO CART,,, well it adds to cart. BUY NOW immediately takes you to the checkout page with JUST this item; irrespective of cart
- [ ] 23. Need to figure out how to deal with discounts in Square API
- [ ] 24. Modify variations on product pages to get options data and transform that into colour buttons using hex codes
- [ ] 26. are we doing this in a stupid way? in square-payment we're passing in line items via strings rather than object IDs.
- [x] 27. alumiermd custom link



## EFFICIENCY THINGS; LOWER PRIORITY
- [ ] 1. I feel like the way im getting products is insanely stupid but im not sure -- check later
   why is this stupid? i cant remember i wrote it last night lol. i think i meant CATEGORIES
- [ ] 3. Fix state in booking flow page.tsx; currently when ServiceSelection gets called for the 'service' step, it resets its state so it doesn't get categories properly; temp fixed
- [x] 4. change store\[id] to store\[slug] where [slug] is a hyphenated version of the name (slug-ID, see productUrl.ts)
- [x] 5. look into different caching strategies for square api calls. 

## OTHER WEBSITE THINGS
- [ ] 1. lightboxes
- [ ] 2. mailing list
- [x] 3. privacy policy & tos page
- [ ] 4. Looki into implementing afterpay??? interest free payments thingy for storefront
- [ ] 5. for storefront; accept gift cards (accept_partial_authorization in payment.create) https://developer.squareup.com/reference/square/payments-api/create-payment
- [ ] 6. add customer creation/checking for checkout

## non website things 
- [x] 1. mom needs to set up sub-categories; then we need to show sub-categories on /store page 







# THINGS THAT ARE DONE
## Booking Flow Square Integration 

- [x] 1. Fix addons not showing in flow 
- [x] 2. Fix labels to account for new step
- [x] 3. Make sure staff member selection only shows applicable members
- [x] 4. Stop querying staff availabilities for dates in the past.
- [x] 5. Finalize booking creation and sending to Square
- [x] 6. Figure out CC info??
- [x] 6a. Make sure it works? Need to update function in squareBookingService.ts that creates the booking to pass in the given CC info?
- [x] 7. Boatload of errors to fix
- [x] 10. Unavailabile dates aren't working properly (Sunday/Wednesday for Dawn)
- [x] 12. Booking confirmation page price is wrong
- [x] 16. i am almost positive theres a stupid bug with how iphones handle dates
- [x] 17. times are wrong on date selection; some timezone funkiness
## FRONTEND: 
- [x] 1. Make sure buttons are consistent between steps (currently they're not!)
- [x] 2. Either remove the images section, or get Dawn to add images via Square
- [x] 3. Scroll to top on every new step
## Square Shop Integration
- [x] 1. Actually implement the Square shop integration
- [x] 2. Make sure users can buy things
- [x] 3. Figure out CC info??
- [x] 3a. Need to update the checkout stuff to adhere to the new way we're doing things that we learned from ClientForm // i think we're fine?
- [x] 4. Show products on /store page
- [x] 5. Product options/variations dont work
- [x] 6. Implement api functions from \products\[id]\route.ts
- [x] 7. Categories are broken: Implement getCategories in productService.ts
- [x] 8. Prices of products are showing as NaN sometimes?
- [x] 9. Need to figure out how images are handled
- [x] 10. Need to figure out how to handle product options
- [x] 11. Need to figure out how to handle product variations in product grid
- [x] 12. Double check that descriptions & such are working
- [x] 13. Re-implement cart and add quantity selector; currently it just adds 1 item to the cart
- [x] 13a. Cart provider is coded; need to make sure it works with the button
- [x] 16. Why we love it/How to use/Ingredients - how can we implement this from square?
- [x] 16a. I'm pretty sure Square sends the description as HTML? So maybe we can do some trickery
- [x] 17. There's an ecom_image_uris being sent with the data but I don't know how to use it, need to use that instead of Ids. lots of references to update here.
- [x] 18. Need to implement api/orders
- [x] 19. Need to implement api/square-payment
- [x] 20. Need to implement stock checking -- this needs the inventory API it seems :|
-- i just casted the type as any :) eff you square api i know that field exists!!!
- [x] 21. Change "View Details" button on ProductCard.tsx's to "Add to Cart" button // This should create a modal popup with the product details (NO DESCRIPTION) and an "Add to Cart" button
- [x] 22. Need to check if product is available online (this is a setting in square); necessary for things like AlumierMD // maybe not a square setting; may need to do this with categories or something
- [x] 25. NEED FORM  VALIDATION ON CHECKOUT PAGE
## EFFICIENCY THINGS; LOWER PRIORITY
- [x] 2. When booking is created, for some reason it checks eveyr single service ever?? // this was due to not passing into serviceId to checkTimeSlotAvailability
## BUGS THAT EXIST ON DEV BUT MAYBE NOT PROD?
- [x] 22. Cart resets on page refresh. Not good // Maybe not? Might be a dev thing
- [x] 23. Clicking "Add to cart" once adds 1 item; clicking it a second time adds 2 items. Not good. Clicking 3 times still only adds 2 items. Not good.
