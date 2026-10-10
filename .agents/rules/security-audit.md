# Security Audit & Pre-Launch Hardening Rules

Whenever reviewing code, preparing a feature for production, or asked to audit the application, always follow these rules:

1. **Secrets Protection:**
   - Never place secret API keys, private tokens, or service credentials in client-side code or `.env` files prefixed with `VITE_`.
   - Ensure all `.env*` files are strictly listed in `.gitignore`.

2. **Route & Authorization Integrity:**
   - Do not rely only on client-side routing guards for sensitive or admin views. Ensure backend endpoints and queries enforce authentication.
   - Prevent privilege escalation; verify user claims and roles against secure records.

3. **Database Security Rules:**
   - Always ensure Firebase Firestore and Realtime Database rules enforce authentication and ownership (`auth.uid != null`).
   - Prevent IDOR: users must only modify/view their own records.

4. **Input Sanitization & Hygiene:**
   - Sanitize all user inputs before processing or storing.
   - Remove any temporary debug endpoints, mock bypass flags, or hardcoded test credentials before completing tasks.
