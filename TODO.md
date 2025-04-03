TODO:

## Booking Flow Square Integration 

- [x] 1. Fix addons not showing in flow 
- [x] 2. Fix labels to account for new step
- [ ] 3. Make sure staff member selection only shows applicable members
- [x] 4. Stop querying staff availabilities for dates in the past.
- [x] 5. Finalize booking creation and sending to Square
- [ ] 6. Figure out CC info??
- [x] 7. Boatload of errors to fix
- [ ] 8. Need to make sure certain categories don't show up in the booking flow step 1 (Addons, Gift Cards, etc) -- i think we can do this with some stuff related to top-level categories
- [ ] 10. Unavailabile dates aren't working properly (Sunday/Wednesday for Dawn)
- [x] 12. Booking confirmation page price is wrong
- [ ] 14. Consent forms are broken
- [ ] 15. Waitlist doesn't work -- can i just link to teh square waitlist form instead of managing it myself?
- [x] 16. i am almost positive theres a stupid bug with how iphones handle dates
- [ ] 17. times are wrong on date selection; some timezone funkiness


### FRONTEND:

- [x] 1. Make sure buttons are consistent between steps (currently they're not!)
- [x] 2. Either remove the images section, or get Dawn to add images via Square
- [x] 3. Scroll to top on every new step

## Square Shop Integration

- [ ] 1. Actually implement the Square shop integration
- [ ] 2. Make sure users can buy things
- [ ] 3. Figure out CC info??
- [x] 4. Show products on /store page
- [x] 5. Product options/variations dont work
- [ ] 6. Implement api functions from \products\[id]\route.ts
- [x] 7. Categories are broken: Implement getCategories in productService.ts
- [x] 8. Prices of products are showing as NaN sometimes?
- [ ] 9. Need to figure out how images are handled


## EFFICIENCY THINGS; LOWER PRIORITY
- [ ] 1. I feel like the way im getting products is insanely stupid but im not sure -- check later
   why is this stupid? i cant remember i wrote it last night lol. i think i meant CATEGORIES
- [ ] 2. When booking is created, for some reason it checks eveyr single service ever??
- [ ] 3. Fix state in booking flow page.tsx; currently when ServiceSelection gets called for the 'service' step, it resets its state so it doesn't get categories properly; temp fixed
- [ ] 4. change store\[id] to store\[slug] where [slug] is a hyphenated version of the name
