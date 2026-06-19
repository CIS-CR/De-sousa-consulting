# De Sousa Consulting email notifications

The Cloudflare Pages worker sends an internal notification after a form submission
is accepted by FBOS.

## Flow

1. The website submits the lead to `/api/demos/de-sousa-consulting/submit`.
2. `_worker.js` proxies the request to `https://api.fbos.org`.
3. If FBOS returns a successful response, the worker sends two emails through
   Resend:
   - An internal notification to De Sousa Consulting.
   - A confirmation to the email entered by the customer.
4. If email sending fails, the form submission still returns the FBOS response.

## Required Cloudflare Pages secret

- `RESEND_API_KEY`

## Optional Cloudflare Pages variables

- `DESOUSA_NOTIFICATION_TO`
  - Defaults to `vasco_de_sousa@live.com`.
  - Supports comma-separated recipients.
- `DESOUSA_RESEND_FROM`
  - Defaults to `De Sousa Consulting <noreply@fbos.org>`.
  - Use `De Sousa Consulting <noreply@desousaconsulting.com>` only after the
    `desousaconsulting.com` sending domain is verified in Resend.

The internal email includes the selected service, FBOS action ID, name, email,
industry, team size, country, and request description. The customer receives a
confirmation with the selected service and request summary.
