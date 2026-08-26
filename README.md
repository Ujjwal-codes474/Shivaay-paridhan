# Shivaay Paridhan V2 — Frontend Redesign

This V2 frontend is a React/Next.js rebuild based on the existing Shivaay Paridhan HTML/CSS/JS frontend.

## What was carried forward from the old frontend
- Brand identity and luxury Indian-fashion positioning
- Home content: New Collection, Shop by Category, collections, benefits, Why Us, CTA
- Customer-care and trust messaging
- WhatsApp ordering/support concept
- Shop, product, cart, checkout, account, wishlist and admin routes already present in V2
- Real product/model assets from the old frontend, moved into `public/legacy/`

## New UI direction
- Next.js 16 + React 19
- Mobile-first responsive layout
- Ivory / navy / burgundy / antique-gold luxury palette
- Editorial serif typography paired with clean sans-serif UI
- Real hero carousel
- Occasion cards using the approved five V2 image assets:
  - `hero-slider.png`
  - `occasion-wedding.png`
  - `occasion-partywear.png`
  - `occasion-casuals.png`
  - `occasion-formal.png`
- Real product imagery from the old frontend instead of using the reference screenshot
- Product cards with wishlist, quick-add, ratings, sale badges and responsive interactions
- Fabric browsing section
- Best sellers, brand story, promise, reviews, offers and trust strip
- Dedicated About and Contact pages

## Important
The supplied reference screenshot is NOT used as a website image.

The old frontend is used as a source of content, features and real assets. The new UI is implemented as React/Next components.

## Run
```bash
npm install
npm run dev
```

Then open:
`http://localhost:3000`

For a production check:
```bash
npm run lint
npm run build
```

## Backend
This package is the V2 frontend layer. Existing backend/API integration can be connected after the UI is approved and tested.


## Homepage image update
- Added the latest Shivaay fashion photography under `public/shivaay/`.
- Hero slides use wide clean images without embedded promotional text.
- Occasion cards use portrait images matched to each occasion.
- Featured product cards now use the new fashion photography.
- Wedding Edit uses a wide campaign image.
- Generated/model imagery is not presented as real customer testimonials.
- Desktop navigation is limited to Home, Shop, Contact Us, and About Us.
