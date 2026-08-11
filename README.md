# I MET TOMORROW — Founder Edition

A mobile-first follow-up experience for The Tomorrow Club. Take a photo, personalize the message, preview the recipient email, and send it through Resend.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the Resend API key locally. Never commit it.
3. Confirm `RESEND_FROM` uses an address on the verified `jointomorrow.org` domain.
4. Run `npm install`, then `npm run dev`.

## Vercel environment variables

- `RESEND_API_KEY` — secret Resend API key
- `RESEND_FROM` — for example `Kyren Garel | The Tomorrow Club <hello@jointomorrow.org>`
- `NEXT_PUBLIC_JOIN_URL` — destination for Join the Movement

Apply all three to Production, Preview, and Development. Redeploy after adding or changing them.

## Production domain

Add `meet.jointomorrow.org` under the Vercel project's Domains settings, then add the DNS record Vercel displays at the current DNS provider. HTTPS is provisioned automatically after DNS verification.
