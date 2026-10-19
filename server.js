import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;
const { GMAIL_USER, GMAIL_APP_PASSWORD, CONTACT_TO_EMAIL } = process.env;

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ['https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many messages. Please try again later.' },
});

const clean = (s, max) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/contact', limiter, async (req, res) => {
  const { name, email, message, hp } = req.body || {};
  if (hp) return res.json({ ok: true }); // honeypot: silently drop bots

  const n = clean(name, 100);
  const e = clean(email, 200);
  const m = String(message ?? '').trim().slice(0, 4000);
  if (!n || !m || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return res.status(400).json({ ok: false, message: 'Please enter your name, a valid email and a message.' });
  }
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('Email credentials are not configured.');
    return res.status(503).json({ ok: false, message: 'The contact service is not configured yet.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"Portfolio contact form" <${GMAIL_USER}>`,
      to: CONTACT_TO_EMAIL || GMAIL_USER,
      replyTo: `"${n.replace(/"/g, '')}" <${e}>`,
      subject: `Portfolio message from ${n}`,
      text: `Name: ${n}\nEmail: ${e}\n\n${m}`,
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Mail error:', err.message);
    return res.status(502).json({ ok: false, message: 'Sorry, your message could not be sent. Please try again later.' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use((_req, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Portfolio running on http://localhost:${PORT}`));
