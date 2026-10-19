# Farhana Mumtaj: Portfolio (static page + Express contact API)

One Node service serves the portfolio (`public/`) and receives contact-form
messages at `POST /api/contact`, then emails them to your inbox through Gmail.

## 1. Get a Gmail App Password (about 2 minutes)
1. Sign in to the Google account that should send the email.
2. Turn on 2-Step Verification: https://myaccount.google.com/security
3. Open https://myaccount.google.com/apppasswords, create an app password
   (name it "Portfolio") and copy the 16-character code.
   Your normal Gmail password will NOT work.

## 2. Run locally
```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
# edit .env: GMAIL_USER=you@gmail.com, GMAIL_APP_PASSWORD=<16 chars>
npm start
```
Open http://localhost:4000, send a test message, and check your inbox
(and spam folder). Replying to the email goes to the visitor.

## 3. Deploy (Render, free tier)
1. Push this folder to a GitHub repository (`.env` is git-ignored).
2. Render dashboard -> New -> Web Service -> pick the repo.
3. Build command: `npm install`   Start command: `npm start`
4. Environment tab, add: `GMAIL_USER`, `GMAIL_APP_PASSWORD`,
   optionally `CONTACT_TO_EMAIL`.
5. Deploy, open the URL, and send a test message.

Free Render services sleep when idle, so the first request can take ~30 s.

## Alternative: no server (Formspree)
If you host only the static `public/` folder (Netlify, GitHub Pages), create a
form at https://formspree.io that forwards to your email, then in
`public/index.html` change `var EP='/api/contact';` to your Formspree URL
(`https://formspree.io/f/xxxxxxx`). Delete `server.js` usage in that case.

## Editing content
Everything lives in `public/index.html`. Replace `public/resume.pdf` to update
the resume download.

## Safeguards in `server.js`
Validation, 10 kB body limit, 5 messages per 15 min per IP, hidden honeypot
field, header-injection stripping, security headers, `/health` endpoint, and
no credentials in client code. Never commit `.env`.
