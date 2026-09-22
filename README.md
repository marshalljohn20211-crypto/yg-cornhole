This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## PayPal checkout

Copy `.env.example` to `.env.local` and add the PayPal REST app credentials directly on the server. Keep `PAYPAL_ENV=sandbox` while testing, then use `PAYPAL_ENV=live` with the live credentials at deployment. Never expose or commit `PAYPAL_CLIENT_SECRET`.

The cart offers PayPal and PayPal-hosted debit or credit card fields. It creates and captures PayPal Orders v2 payments through server-only route handlers. Product prices are recalculated from `app/data/products.ts`; totals sent by the browser are not trusted.

After a server-verified capture, the confirmation screen offers a private downloadable text receipt and a print-friendly confirmation. Set a stable `RECEIPT_SECRET` of at least 32 characters in production so existing receipt links remain valid if PayPal or admin credentials are rotated. If omitted, receipt signing falls back to `ADMIN_SESSION_SECRET` or `PAYPAL_CLIENT_SECRET`.

### PayPal webhook

Register `https://ygcornhole.com/api/paypal/webhook` on the same PayPal REST app whose credentials are deployed. Subscribe to `CHECKOUT.ORDER.APPROVED`, `CHECKOUT.PAYMENT-APPROVAL.REVERSED`, `PAYMENT.CAPTURE.PENDING`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, and `PAYMENT.CAPTURE.REFUNDED`. Copy the Webhook ID PayPal creates into `PAYPAL_WEBHOOK_ID`. Sandbox and live apps have separate webhook registrations and IDs.

The endpoint verifies every signature with PayPal before updating an order, records webhook event IDs to make retries idempotent, checks completed amounts/currency against the stored order, and returns a non-2xx response when an event needs PayPal to retry.

## Order admin

The checkout collects the customer name, email, contact number, full US/Canadian delivery address, and optional delivery notes before either PayPal or card payment. Pending orders are recorded when PayPal creates the order and marked paid after a verified capture.

Admin accounts and salted `scrypt` password hashes are stored in MySQL. Set a random `ADMIN_SESSION_SECRET` of at least 32 characters, then open `/admin`. Successful sign-in creates an HTTP-only, same-site, signed session cookie that expires after eight hours.

Orders are stored in MySQL or compatible MariaDB. Set `DATABASE_URL` to the server-side connection string, or provide `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` separately. The separate variables match GoDaddy Hosted Database secrets. Apply `db/schema.sql` for a new database. For an existing installation, apply `db/migrations/2026-09-23-order-reliability.sql` once before deploying this version. Checkout is intentionally blocked before payment when MySQL is not configured.

The admin order desk supports search, status filtering, pagination, PayPal reconciliation, and controlled fulfillment stages: paid, processing, shipped, and completed. Reconciliation expires checkouts older than 24 hours only after PayPal confirms they remain unapproved, and deletes expired records after 90 days. For automatic maintenance, schedule an hourly `POST` to `/api/maintenance/orders` with `Authorization: Bearer <ORDER_MAINTENANCE_SECRET>`. The database account therefore needs `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on the application tables.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
