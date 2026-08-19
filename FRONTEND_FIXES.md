# Shivaay Paridhan Frontend Fixes

Applied from the uploaded frontend project:

- Removed the built-in 16-product demo inventory.
- Backend `/api/products` is now the single source of truth; stale localStorage products are no longer merged into live shop data.
- Admin dashboard/users now read the same `authToken` key that login stores.
- Admin order list/status requests send the admin bearer token.
- Main navigation is now Home, Shop, About Us, Contact Us with clean routes.
- Shop collection navigation is now All, Festive, Wedding, Daily Wear, Party Wear, Formal.
- Shop occasion filtering supports explicit backend occasion fields plus conservative legacy keyword matching.
- Clean internal routes are used instead of `.html` filenames.
- Existing `/product/:slug` rewrite remains in place and product detail is loaded by slug.
