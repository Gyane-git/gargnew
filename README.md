This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More:

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
deployI
## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details...

---

## Laravel API Compatibility Layer (Mobile App Support)

### Why this exists

The legacy Laravel backend (`gargdental`, ~68 endpoints under `/api/v1/*`, Passport bearer auth) is still what the **mobile app** talks to. This Next.js backend already runs the **web e-commerce storefront** and shares the same MySQL database (`omsokcom_gargdental`), but its API surface grew independently of Laravel's — some Laravel endpoints didn't exist here at all, and a few existed at the identical URL but returned a different shape because they were originally built only for the web app.

The goal of this work: let the mobile app be pointed at this Next.js backend **with zero mobile-app changes**, while never breaking the live web app. This required first fully cataloging both APIs (68 Laravel endpoints vs. the existing Next.js routes) and cross-checking every URL that exists in both against actual web-frontend call sites, so every change below is backed by a verified understanding of what the web app actually depends on.

### Policy used for shared/conflicting URLs

Several Laravel endpoints already existed in this project at the identical URL, serving the web app with a different response shape (e.g. `POST /api/v1/auth/login`, `/api/v1/register`, `GET /api/v1/compliances`, `/api/v1/customer/info`, `/api/v1/products/search`, `/api/v1/products/details/[code]`, `GET /api/v1/banners`). Since a Next.js route can only have one handler per URL, these were resolved with an **additive-only merge**: never remove, rename, or change the meaning of any field or status code the web app already reads; only add the fields Laravel requires, accept Laravel's request field names as extra aliases, and align HTTP status codes only where verified safe (i.e. the web code checks `response.ok` / `success`, not the exact numeric status).

### New endpoints added (previously missing entirely)

These mirror their Laravel counterpart's URL, request shape, response shape, and status codes exactly:

| Endpoint | What it does |
|---|---|
| `GET /api/v1/get-valley-wise-address` | Returns a **raw JSON array** (no `{success,...}` envelope, matching Laravel exactly) of Kathmandu/Lalitpur shipping zones. |
| `GET /api/v1/products/category/{categoryId}` | Path-param variant of the existing `products/category-wise-products` (query-param) endpoint — recursively includes descendant categories, optional `is_wishlisted` when authenticated. |
| `POST /api/v1/customer/products/add-recommended/{product_code}` | Auth required. Records a product as "viewed/recommended" for the customer, trims history to the most recent 10. |
| `GET /api/v1/customer/products/recommended` | Auth required. Returns the customer's recommended products (key is `recommended_products`, not `products`), backfilled with random active products if fewer than 5 exist. Each item has a field literally named `wishlist` (kept as-is to match Laravel, even though other endpoints use `is_wishlisted`). |
| `POST /api/v1/customer/check-valley` | Auth required. Given an `address_id`, returns `{success, inside_valley}` — used to decide free-shipping eligibility. |
| `POST /api/v1/customer/reviews/add` (singular `customer`) | Auth required. Submits a review for a delivered order (validates the order belongs to the customer and is delivered). Deliberately mirrors a Laravel quirk: validation failures return status **422** with a `status` key (not `success`) and raw nested errors — this is intentional, not a bug. |
| `GET /api/v1/customer/reviews/list` (singular `customer`) | Auth required — the customer's own submitted reviews. **Bonus fix**: `app/myaccount/components/MyReview.js` already called this exact URL and was silently 404ing because only the plural `/customers/reviews/list` route existed — this route now makes that existing web page work. |
| `GET /api/v1/promotions` (plain, no `/mobile`) | Active promotions with product details — confirmed unused by web or admin before adding, so this was a brand-new route, not a change to any live endpoint. |
| `GET /api/v1/banners/get-cards` | **Rewritten** — this route previously queried the unrelated `carousel_images` table and returned `{cards, banners}`, but had zero real consumers (confirmed via full frontend search). Replaced wholesale with the correct implementation reading the `poster_cards` table, matching Laravel's `{success, message, poster_cards}` shape. |

### Existing endpoints extended (additive only — nothing removed)

| Endpoint | What was added |
|---|---|
| `POST /api/v1/auth/login` | Added `requires_address` (true if the customer has no saved address) and a `name` field inside `user` (alongside the existing `full_name`). |
| `POST /api/v1/auth/social/google-register` | Same additions as login: `requires_address`, `user.name`. |
| `POST /api/v1/register` | Validation/duplicate-email failures now return status **403** (was 400/409) to match Laravel — safe because the web signup page only checks `response.ok`, not the exact code. |
| `POST /api/v1/auth/forgot-password-code` | Added an `email` field to the success response. |
| `POST /api/v1/customer/change-password` | `current_password` is now **optional** — verified only when the caller sends it (web always does and still gets that check); skipped when absent, matching Laravel's laxer rule (the mobile app never sends it). |
| `GET /api/v1/customer/info` | Added the customer's fields again at the **top level** of the response (duplicated, not moved — the existing nested `data` object is untouched), plus a top-level `shipping_cost` computed from the address flagged as default shipping. |
| `GET /api/v1/customer/address/list` | Now returns status **201** (an intentional Laravel quirk, even for a GET) with a `message` field added. |
| `POST /api/v1/customer/address/add` | Now returns status **201** to match Laravel (was 200). |
| `GET /api/v1/products/search` | **Bug fix + parity fix in one change**: this route was returning a flat `products: [...]` array, but the web search bar/page already expected Laravel's nested `{products: {total_size, products: [...]}}` shape — meaning search suggestions were silently broken on the live site. Now fixed to return the nested shape. |
| `GET /api/v1/products/details/[product_code]` | A nonexistent product code now returns **200** with `{success:true, product:null}` instead of a 404, matching Laravel (verified safe: the product page already treats a failed fetch and a null product identically). |
| `GET /api/v1/offers` | Added a `message` field. |
| `GET /api/v1/banners` (plain) | Added a `message` field. |

### Swagger / API documentation

Added `next-swagger-doc` + `swagger-ui-dist`:
- OpenAPI spec is generated from `@swagger` JSDoc comment blocks scanned across the `app/api` tree — covering every **frontend-facing** endpoint (web storefront + the Laravel mobile-compatibility layer): products, categories, brands, banners, offers, promotions, cart, wishlist, orders, customer profile/addresses/reviews, compliance/CMS content, auth, payments, etc. **121 endpoints are documented in total.**
- The admin dashboard's own backend API (`app/api/v1/admin/**` and `app/api/system-users/**` — admin auth, profile, website settings, system-users, audit-logs, excel-upload, image-folder, admin/orders) is intentionally left **undocumented**, exactly as it was before this work — those routes still function normally, they just don't appear in `/api-docs`. Swagger coverage here is scoped to what the storefront/mobile app actually calls, not the admin panel's internal API.
- Spec generator: `utils/swagger.js` (`apiFolder: "app/api"`, `servers: [{url: "/"}]` — every `path:` in every annotation is written as the full path from the site root, e.g. `/api/v1/products/search`, `/api/auth/logout`).
- Spec JSON endpoint: `/api/api-docs`
- Interactive viewer: **`/api-docs`** (Swagger UI — open this in a browser to explore/test every documented endpoint). This page is excluded from the storefront's header/footer/chat-widget chrome (`components/LayoutWrapper.tsx`), the same way `/admin` routes already were, since it's a standalone API reference, not a storefront page.
- Auth is documented as `security: [{bearerAuth: []}]` only where the route handler actually enforces it (calls `getAuthUser` and returns 401/`unauthorizedResponse()` on failure). Many admin CRUD routes in this codebase call `getAuthUser` only to attribute an audit-log entry, without ever rejecting an unauthenticated request — those are documented as unauthenticated, reflecting actual current behavior rather than assumed intent. See "Notable things found" below.
- Note: the viewer mounts `swagger-ui-dist`'s vanilla JS bundle imperatively (`app/api-docs/page.js`) rather than using the `swagger-ui-react` wrapper. `swagger-ui-react` was tried first but wraps old class components that use the deprecated `UNSAFE_componentWillReceiveProps` lifecycle, which React's StrictMode (on by default in Next.js dev) flags with a loud dev-overlay error — harmless, but avoided by mounting the vanilla bundle outside React's component tree instead.

### Notable things found while documenting the existing API (not fixed — flagged for follow-up)

Writing accurate documentation required reading every route's actual behavior, which surfaced a few pre-existing issues unrelated to the compatibility work above. None of these were touched, per the "document only" scope of this pass:

- **`GET /api/v1/products/code/[product_code]`** is effectively broken today: the handler destructures `const { code } = await params`, but the folder is `[product_code]`, so `params.code` is always `undefined`. Every call falls through to a 500. Likely fix: read `product_code` instead of `code`.
- **`GET /api/v1/brands/products`** is likely dead/broken: it reads `const { id } = params`, but this route has no dynamic segment (no `[id]` folder), so `id` is always `undefined` and it always resolves to "Brand not found."
- **No enforced API-layer authentication** on most admin CRUD routes (brands, categories, banners, offers, customers, system-users, admin/orders, admin/website, address reference data, and others) — they rely entirely on the admin UI being behind `middleware.ts`'s page-level guard (which only matches `/admin/:path*` and `/account/:path*`, not `/api/*`). The raw endpoints are callable unauthenticated. This was true before this documentation pass; it's just newly visible now that every route is documented with its actual (lack of) auth.
- **`app/api/v1/profile/change-password`** trusts a client-supplied `userId` in the request body instead of validating a bearer token/session — worth a security review given `/api/v1/customer/change-password` is the properly auth-gated equivalent.

### Shared response helpers added

`utils/apiResponse.js` — used only by the new routes above, so it never changes behavior of any pre-existing endpoint:
- `successResponse()` / `serverErrorResponse()` — generic envelope helpers.
- `validationErrorResponse()` — mirrors Laravel's dominant validation-error shape (`{success:false, message:"Validation errors", errors:[{code,message}]}`, status 403).
- `unauthenticatedResponse()` — mirrors Laravel's `auth:api` 401 shape (`{error:"Unauthenticated", message:"..."}`), which is intentionally different from the existing `unauthorizedResponse()` in `utils/authUser.js` (used by all pre-existing routes and left untouched).

### Verified during implementation

Every new/changed endpoint was hit directly (curl/REST calls against the real dev database, including full register → verify → login → change-password round-trips using throwaway test accounts that were deleted afterward) and every web page that depends on a touched shared endpoint was reloaded to confirm it still works: home, dashboard, search, account, signup, forgot-password, myaccount, cart, and product detail pages.

### Known open item

`GET /api/v1/clinic/clinic-setup` was **left unchanged** — the web app depends on its current array shape, but Laravel's own shape for this endpoint is object-keyed. Since there's no way to verify what the mobile client actually parses without its source, this was intentionally not changed speculatively. If mobile QA reports a parsing mismatch here, this is the one endpoint to revisit.
