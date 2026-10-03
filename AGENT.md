# Varnika — Agent Guide

## Project Overview

Varnika is a **luxury atelier admin console** built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. It manages bespoke fashion orders, clients, measurements, deliveries, and support tickets.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5.6 |
| UI | React 18.3 + Tailwind CSS 3.4 |
| Components | shadcn/ui (custom, in `components/ui/`) |
| Icons | lucide-react |
| Charts | recharts |
| DnD | @dnd-kit/core + @dnd-kit/sortable |
| Data | Supabase Postgres (`lib/supabase/` query layer) |

## Architecture

### Routing
- **File-based routing** via Next.js App Router (`app/` directory)
- All pages are **client components** (`"use client"`)
- Dynamic routes use `[id]` pattern (e.g., `app/customers/[id]/page.tsx`)
- Route params accessed via `params` prop (Next.js 14 pattern):
  ```tsx
  export default function Page({ params }: { params: { id: string } }) { ... }
  ```

### Directory Structure
```
app/                    # Pages (App Router)
  customers/            # Customers list + [id] detail
  orders/               # Orders kanban/tickets/past + [id] detail
  catalog/              # Product catalog
  delivery/             # Shipment tracking
  tickets/              # Support tickets
  analytics/            # Charts & metrics
  reports/              # Reports
  revenue/              # Revenue dashboard
  settings/             # App settings
components/
  layout/               # AppShell, TopNavBar, Sidebar, RouteGuard, etc.
  ui/                   # shadcn/ui primitives (button, badge, card, dialog, etc.)
  providers/            # AppProviders
lib/
  api/                  # (empty — legacy mocks deleted; Supabase is the backend)
  config/               # navigation.ts
  context/              # auth-context, feature-flags-context, navigation-context
  navigation/           # resolver.ts
  types/                # auth.ts, features.ts, navigation.ts
  utils.ts              # cn(), formatCurrency(), formatDate()
```

### Data Layer
- **Supabase (Postgres)** is the live database. Schema: `supabase/migrations/0001_varnika_init.sql`
- Browser client singleton: `lib/supabase/client.ts` (uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `.env.local`)
- Row types: `lib/supabase/database.types.ts` (snake_case, mirrors tables)
- Query/mutation functions:
  - `lib/supabase/queries-customers.ts` — customers + measurements CRUD
  - `lib/supabase/queries-orders.ts` — orders + timeline/photos/documents
  - `lib/supabase/queries-ops.ts` — transactions, shipments + milestones, ticket status
  - `lib/supabase/queries-products.ts` — catalog products CRUD
- All queries throw on error; pages catch and show retry banners
- Dashboards (Home, Revenue, Analytics, Reports) read live aggregates via `lib/supabase/stats.ts`; Reports exports real CSVs via `downloadCsv()` in `lib/utils.ts`
- Customer aggregates (`total_spent`, `orders_count`, `last_order_at`) are maintained by a DB trigger on `orders`
- No mock data remains — every page (including dashboards) reads live Supabase data

### Auth & Permissions (RBAC)
- Real Supabase Auth email/password sessions (`/login` page, session persisted by supabase-js)
- Two roles only: `admin` (everything) and `staff` (all operations, no revenue/reports/settings)
- Role resolves from `employees.app_role` matched by login email; any authenticated login without an employee row defaults to staff
- `RouteGuard` redirects unauthenticated visitors to `/login?next=...` and shows a spinner while the session resolves
- The audit actor is always the signed-in user — no role switching exists anywhere

### Feature Flags
- 10 feature flags control module visibility
- Managed via `FeatureFlagsProvider` context, persisted to localStorage
- Checked in `RouteGuard` and navigation resolver

## Design System

### Colors
- Background: `#FAF9F6` (warm off-white)
- Surface: `#FFFFFF`
- Border: `#E6E3DB` (warm gray)
- Border light: `#F0ECE1`
- Text: `#141414` (near-black)
- Muted text: `neutral-400` / `neutral-500`
- Accent: `black` (primary actions, active states)

### Typography
- Font: `font-sans` (system)
- Page titles: `text-2xl sm:text-3xl font-semibold tracking-tight`
- Section labels: `text-[10px] uppercase font-mono text-neutral-400`
- Body: `text-xs` or `text-[11px]`
- Mono (numbers, IDs): `font-mono`

### Spacing & Shape
- Border radius: `rounded-xs` (small, 2-4px)
- Card padding: `p-3` to `p-6`
- Gap: `gap-2` to `gap-4`
- Page container: `max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8`

### Component Patterns
- **Cards**: `bg-white border border-[#E6E3DB] rounded-xs`
- **Inner sections**: `bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs`
- **Badges**: Use `Badge` component with `variant="outline" | "secondary" | "muted"`
- **Buttons**: Use `Button` component with `variant="default" | "outline" | "ghost"`
- **Tables**: Header `bg-[#FAF9F6]`, rows `divide-y divide-[#F0ECE1]`, hover `hover:bg-[#FAF9F6]`

## Key Conventions

1. **All pages use `RouteGuard`** — wrap page content with `<RouteGuard requiredPermission="...">`
2. **Revenue data is permission-gated** — check `permissions.includes("revenue.read")` before showing financial data
3. **Responsive design** — every page has desktop table/card views AND mobile card list views
4. **Animations** — use `animate-in fade-in duration-200` on page containers
5. **Icons** — always from `lucide-react`
6. **No mock data** — all reads/writes go through `lib/supabase/queries-*.ts`

## Common Patterns

### Creating a New Page
1. Create `app/[section]/page.tsx` with `"use client"`
2. Wrap content in `<RouteGuard requiredPermission="...">`
3. Use the standard header pattern (title + description + border-b)
4. Add search input with `Search` icon
5. Use responsive grid/table for data display

### Creating a Detail Page
1. Create `app/[section]/[id]/page.tsx` with `"use client"`
2. Access ID via `params` prop
3. Fetch the record with the appropriate `get*` query (show `loading.tsx` skeleton meanwhile)
4. Show "Not found" state if ID doesn't match
5. Include a "Back" link to the list page

### Adding a UI Component
1. Create `components/ui/[name].tsx`
2. Use `React.forwardRef` pattern (shadcn style)
3. Accept `className` prop, merge with `cn()`
4. Export from the file
5. Import and use in pages

## Available UI Components

| Component | Import |
|-----------|--------|
| Button | `@/components/ui/button` |
| Badge | `@/components/ui/badge` |
| Card | `@/components/ui/card` |
| Dialog | `@/components/ui/dialog` |
| Input | `@/components/ui/input` |
| Tooltip | `@/components/ui/tooltip` |
| Skeleton | `@/components/ui/skeleton` |
| Timeline | `@/components/ui/timeline` |
| Page skeletons | `@/components/ui/page-skeletons` |
| Kanban board | `@/components/ui/kanban` (vendored reui primitive: dnd-kit mouse/touch/keyboard sensors, live preview + single commit with rollback) |
| Textarea | `@/components/ui/textarea` |

## Audit Trail (Employees + Updates)

## Chat (replaces Queries/Tickets UI)

- `conversations` + `chat_messages` + `chat_attachments` tables (`chat.read/write` permission, `chat` feature flag)
- `/chat` page: conversation list + thread, staff reply, client-preview toggle, file/photo upload to `order-photos` storage bucket
- Attachments with an order auto-fan-out into `order_photos`/`order_documents` via DB trigger — visible on order + customer pages regardless of which site added them
- Customer detail has a Photos & Files card aggregating chat attachments
- The old `/tickets` page is deleted (table kept for history; Updates feed still renders ticket events)

- `employees` table + `/employees` page (add/edit/deactivate, `employees.read/write` permissions)
- "Acting as" selector in `TopNavBar` (via `ActorProvider`, persisted to localStorage) — every mutation stamps this name
- `activity_log` table (actor, action, entity snapshots + customer/order links, timestamp). Writes go through `logActivity()` in `lib/supabase/activity.ts`, which never throws
- `/updates` page renders the feed with always-underlined customer/order links; filter chips per entity type
- Every create/update/status-change/milestone/resolve across customers, orders, transactions, shipments, tickets, products, employees logs an entry

## Deployment (Cloudflare Workers via OpenNext)

- Adapter: `@opennextjs/cloudflare@1.14.10` (exact-pinned; newer majors dropped Next 14)
- Config: `wrangler.jsonc` (worker `varnika-console`, `nodejs_compat`, assets from `.open-next/`), `open-next.config.ts` (defaults — MUST exist or builds hang on an interactive prompt)
- Dynamic `[id]` routes run on the Node.js runtime — do NOT add `export const runtime = "edge"` (unsupported by the adapter)
- Dashboard (reuse the `varnika-console` Worker): build `npx opennextjs-cloudflare build`, deploy `npx wrangler deploy`, env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (+ `NODE_VERSION=22`)
- `npm run preview` = local worker preview; `npm run deploy`/`upload` = CLI deploy

## Route Loading States (Skeletons)

Every list/detail route has a `loading.tsx` that renders instantly on `<Link>` navigation while the destination page loads — without it, the app feels "stuck" on the old page:

| File | Skeleton |
|------|----------|
| `app/customers/[id]/loading.tsx` | `CustomerDetailSkeleton` |
| `app/orders/[id]/loading.tsx` | `OrderDetailSkeleton` |
| `app/customers/loading.tsx`, `app/orders/loading.tsx`, `app/orders/past/loading.tsx`, `app/transactions/loading.tsx` | `TableListSkeleton` |
| `app/delivery/loading.tsx`, `app/tickets/loading.tsx` | `CardsListSkeleton` |

Convention: when adding a new route, add a matching `loading.tsx` reusing one of these skeletons. Base shimmer primitive is `Skeleton` in `@/components/ui/skeleton`.

## Navigation Feedback

`components/layout/NavigationProgress.tsx` (mounted in `AppShell`) shows an instant top progress bar on any internal link click — it fires in the click frame via a capture-phase listener, before the router fetches anything. This covers cold navigations (dev-mode route compilation, ~1–4s) where even `loading.tsx` can't render yet. The bar completes + hides on pathname change, with an 8s fail-safe.

## Form Dialogs (Add/Edit)

Reusable Add/Edit dialogs live in `components/forms/`:

| Dialog | File | Used By | Permission |
|--------|------|---------|------------|
| CustomerFormDialog | `components/forms/CustomerFormDialog.tsx` | Customers list + detail | `customers.write` |
| OrderFormDialog | `components/forms/OrderFormDialog.tsx` | Orders list + detail | `orders.write` |
| TransactionFormDialog | `components/forms/TransactionFormDialog.tsx` | Transactions page | `transactions.write` |
| ShipmentFormDialog | `components/forms/ShipmentFormDialog.tsx` | Delivery page | `delivery.write` |

> Note: Client Queries (Tickets) are read-only — they sync automatically from the external website, so there is no add/edit dialog for them. Reply / Mark Resolved actions remain in the ticket modal.

Shared field styling: `components/forms/fields.tsx` (`Field`, `inputCls`, `selectCls`).

**Data mutation pattern:** pages fetch via `list*` queries into local `useState`, and save handlers call the matching `create*`/`update*` query then update state (or refetch). New records appear everywhere because every page reads the database.

## Cross-Linking (Redirect Icons)

Customer and order names carry `ExternalLink` redirect icons across pages:

- Orders (kanban + tickets) → customer name links to `/customers/[id]`
- Customer detail → order numbers link to `/orders/[id]`
- Order detail → customer name links to `/customers/[id]`
- Transactions → both customer and order link out
- Past Orders → both customer and order link out
- Delivery → customer + order resolved via `orderId` → links out
- Tickets → customer + order resolved via `customerId`/`orderId` → links out

## Utility Functions

| Function | Import |
|----------|--------|
| `cn(...classes)` | `@/lib/utils` |
| `formatCurrency(amount, currency?)` | `@/lib/utils` |
| `formatNumber(num)` | `@/lib/utils` |
| `formatDate(dateString)` | `@/lib/utils` |
| `formatDateTime(dateString)` | `@/lib/utils` |
