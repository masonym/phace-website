TODO:

## Booking Flow Square Integration 

- [ ] 3. Make sure staff member selection only shows applicable members
- [ ] 8. Need to make sure certain categories don't show up in the booking flow step 1 (Addons, Gift Cards, etc) -- i think we can do this with some stuff related to top-level categories
- [ ] 10. Unavailabile dates aren't working properly (Sunday/Wednesday for Dawn)
- [ ] 14. Consent forms are broken
- [ ] 15. Waitlist doesn't work -- can i just link to teh square waitlist form instead of managing it myself?
- [ ] 17. times are wrong on date selection; some timezone funkiness


## Square Shop Integration

- [ ] 15. Add to Cart vs Buy Now option (what does this do?) // ADD TO CART,,, well it adds to cart. BUY NOW immediately takes you to the checkout page with JUST this item; irrespective of cart
- [ ] 23. Need to figure out how to deal with discounts in Square API
- [ ] 24. Modify variations on product pages to get options data and transform that into colour buttons using hex codes
- [ ] 26. are we doing this in a stupid way? in square-payment we're passing in line items via strings rather than object IDs.



## EFFICIENCY THINGS; LOWER PRIORITY
- [ ] 1. I feel like the way im getting products is insanely stupid but im not sure -- check later
   why is this stupid? i cant remember i wrote it last night lol. i think i meant CATEGORIES
- [ ] 3. Fix state in booking flow page.tsx; currently when ServiceSelection gets called for the 'service' step, it resets its state so it doesn't get categories properly; temp fixed
- [ ] 4. change store\[id] to store\[slug] where [slug] is a hyphenated version of the name
- [ ] 5. look into different caching strategies for square api calls. 

## OTHER WEBSITE THINGS
- [ ] 1. lightboxes
- [ ] 2. mailing list
- [ ] 3. privacy policy & tos page
- [ ] 4. Looki into implementing afterpay??? interest free payments thingy for storefront
- [ ] 5. for storefront; accept gift cards (accept_partial_authorization in payment.create) https://developer.squareup.com/reference/square/payments-api/create-payment
- [ ] 6. add customer creation/checking for checkout








# THINGS THAT ARE DONE
## Booking Flow Square Integration 

- [x] 1. Fix addons not showing in flow 
- [x] 2. Fix labels to account for new step
- [x] 4. Stop querying staff availabilities for dates in the past.
- [x] 5. Finalize booking creation and sending to Square
- [x] 6. Figure out CC info??
- [x] 6a. Make sure it works? Need to update function in squareBookingService.ts that creates the booking to pass in the given CC info?
- [x] 7. Boatload of errors to fix
- [x] 12. Booking confirmation page price is wrong
- [x] 16. i am almost positive theres a stupid bug with how iphones handle dates
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
