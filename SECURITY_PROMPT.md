# 🛡️ Pre-Launch Security Audit Prompt & Instructions

> **Source:** Security audit methodology by [@krishanu.builds](https://www.instagram.com/reels/DePJrTNgh3b/) for AI/vibe-coded applications.  
> **Purpose:** Run this prompt against your codebase before launching to production to detect leaked keys, broken access control, unsecured databases, and package vulnerabilities.

---

## 📋 Master Claude / AI Security Audit Prompt

Copy and paste the prompt below into Claude, ChatGPT, Cursor, or Antigravity:

```markdown
Act as a senior application security engineer (AppSec). Perform a comprehensive security audit of my codebase before production launch.

Audit these 5 critical areas:
1. Secrets & Environment Variables:
   - Identify any private API keys, connection strings, or service credentials exposed in frontend code or client bundles.
   - Verify .gitignore covers all sensitive files and no secrets were embedded in build outputs or committed to git history.
2. Route & Endpoint Authorization:
   - Check if admin routes and sensitive API endpoints are truly enforced on the server/backend, or if they rely only on client-side state.
   - Check for privilege escalation where a user could modify their role or access unauthorized endpoints.
3. Database Security & IDOR:
   - Inspect database queries and access rules (RLS / Firebase Security Rules). Ensure users cannot read or mutate data belonging to others.
4. Input Validation & Injection:
   - Identify potential XSS, SQL/NoSQL injection, or CSRF vulnerabilities in forms and API handlers.
   - Verify rate limiting on authentication and OTP endpoints.
5. Dependencies & Code Hygiene:
   - Flag any unused, deprecated, or vulnerable packages, test backdoors, bypass passwords, or debug endpoints.

For every issue found, provide:
- Severity (Critical, High, Medium, Low)
- File path & line number
- Exploit scenario (how an attacker would exploit it)
- Exact corrected code / drop-in patch
```

---

## 🔒 19 Pre-Launch Defense Checkpoints

### 1. API Keys & Secrets
1. **Client Bundles:** Never prefix private service keys (Stripe secret, AI keys, DB passwords) with `VITE_` or `NEXT_PUBLIC_`.
2. **Git Hygiene:** Ensure `.env`, `.env.local`, and credential files are in `.gitignore` and not in git history.
3. **Backend Proxy:** Route third-party secret-bearing API calls through a secure backend proxy or serverless function.
4. **Domain Restrictions:** Configure allowed HTTP referrers and origins in provider dashboards (Firebase, Google Cloud, Stripe).

### 2. Admin Routes & Authentication
5. **Server-Side Enforcement:** Protect all admin routes and sensitive APIs with verified server-side JWT/session validation.
6. **Role Tampering Protection:** Never trust `{ role: 'admin' }` sent from browser payloads; verify roles against server database records.
7. **Rate Limiting:** Protect login, registration, password reset, and OTP routes against brute-force and credential stuffing.
8. **Secure Cookies:** Store session tokens with `HttpOnly`, `Secure`, and `SameSite=Strict`.

### 3. Database & Access Control
9. **Strict Security Rules / RLS:** Enable restrictive Firebase Rules or Supabase Row-Level Security before production.
10. **IDOR Prevention:** Ensure users can only read/update records where `auth.uid == resource.data.userId`.
11. **Input Sanitization:** Sanitize and parameterize all queries to prevent injection attacks and XSS.

### 4. Dependencies & Code Hygiene
12. **Package Pruning (`BLOCKED UNUSED PKGS`):** Run `npm audit` and `npm prune` to eliminate vulnerable or unused packages.
13. **Remove Test Backdoors:** Eliminate hardcoded mock users, bypass tokens, test OTP codes, and debug flags.
14. **Error Sanitization:** Never expose raw database errors or stack traces to end users.

### 5. Transport & Headers
15. **HTTPS Enforcement:** Redirect all traffic to HTTPS with HSTS enabled.
16. **Security Headers:** Configure CSP, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.
17. **CORS Restrictions:** Restrict `Access-Control-Allow-Origin` strictly to your production domain.

### 6. Payments & Webhooks
18. **Webhook Signature Verification:** Verify cryptographic signatures on all payment webhooks (Stripe, bKash/Nagad IPN).
19. **Idempotency:** Prevent double billing or duplicate orders using unique idempotency keys.
