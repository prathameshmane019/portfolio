# Prathamesh Mane — Portfolio

A light-first engineer’s logbook portfolio with editorial typography, project
case files, a live IST clock, keyboard command palette, terminal easter egg,
GitHub activity, a private content control room, and a Nodemailer contact form.

## Run locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set `NEXT_PUBLIC_SITE_URL` to the canonical production URL before deploying.

## Contact delivery

The contact API sends mail over SMTP with Nodemailer. For Gmail:

1. Enable 2-Step Verification on the Google account.
2. Create a Google App Password; do not use the account password.
3. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`,
   `SMTP_USER`, and `SMTP_PASSWORD`. `CONTACT_FROM_EMAIL` is optional and
   defaults to `SMTP_USER`.
4. Optionally set `CONTACT_TO_EMAIL` (defaults to the saved profile email).
   `CONTACT_FROM_EMAIL` should be the authenticated SMTP address or an alias
   that your provider permits.

The API validates all submitted fields, ignores the hidden honeypot, limits
requests to five per IP per hour in each running server instance, and saves each
valid submission to `data/messages.json`. It emails the portfolio owner and
sends the visitor a branded acknowledgment; if email delivery fails, the
message remains saved and the admin inbox reports which email failed. Use
`PORTFOLIO_MESSAGES_FILE` to select another writable path. For horizontally
scaled production deployments, replace the in-memory limiter with a shared
store such as Redis.

## Admin control room

Visit `/admin` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Set
`ADMIN_SESSION_SECRET` to a random secret of at least 32 characters. The
dashboard edits profile details, projects, experience, skills, education,
recognition, and stats; scans for remaining TODO markers; supports live preview;
and downloads/restores a full JSON backup, including the résumé PDF. The
**Messages** section provides a saved contact inbox with delivery indicators
and an admin reply composer that emails the sender using the portfolio SMTP
identity. Collection
entries and skill lists can be searched and reordered by dragging or using the
keyboard-friendly move buttons. The profile editor can replace the résumé by
dropping or selecting a PDF (up to 10 MB). Use **Save changes** or `Ctrl+S` to
publish content edits. Admin routes are excluded from search indexing and protected by
an HTTP-only, strict same-site session cookie.

In **Admin → Projects**, each non-confidential project has a cover image and
up to eight screenshots. Upload JPEG, PNG, or WebP images up to 4 MB each;
replace or remove images there. Covers appear on project cards and detail pages,
and screenshots appear in each project's screenshot gallery. Projects marked
confidential stay redacted and cannot accept uploaded images.

For local development without MongoDB, content is stored in
`data/content.json`, messages in `data/messages.json`, and the résumé PDF at
`public/resume.pdf`; the `PORTFOLIO_*_FILE` variables can override those paths.
When `MONGODB_URI` is configured, MongoDB Atlas stores editable portfolio
content, contact messages, and the résumé PDF. MongoDB storage takes precedence
over the local JSON/filesystem store. Without it, filesystem storage is for
local development or a single writable Node.js server only; it is not durable
on Vercel. Vercel API routes return a configuration error instead of pretending
to save to its temporary filesystem when MongoDB is missing.

### Configure MongoDB Atlas for Vercel

1. Create an Atlas cluster and a database user with a strong unique password.
   Grant only `readWrite` access to the portfolio database.
2. Configure Atlas Network Access for your Vercel deployment. Prefer Vercel
   Secure Compute/static egress where available; if using a broad IP rule,
   restrict the database user to this app and use a strong password.
3. Copy the Atlas driver connection string into `MONGODB_URI` and set
   `MONGODB_DB=portfolio` (or your chosen database name) in Vercel's project
   environment variables. Add them to every deployment environment that needs
   admin access, then redeploy.
4. For local development with Atlas, put the same values in the untracked
   `.env.local` file. Do not commit the connection string.
5. After deployment, sign in to `/admin`; if you have an existing JSON backup,
   restore it from **Restore** to seed the Atlas content and résumé. Export a
   fresh backup after migration. Contact messages are not included in content
   backups and must be retained separately.

MongoDB stores the résumé as binary data in a separate asset document; the
current 10 MB upload limit is within MongoDB's document size limit. Project
images are stored as individual binary documents in `project_media`; on local
development without MongoDB, they are stored under `data/project-media`.
Back up your Atlas database as well as downloading portfolio backups regularly.

### Required credentials

- **SMTP:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD`.
  For Gmail, use `smtp.gmail.com`, port `465`, and a Google App Password
  (requires 2-Step Verification); do not use your regular Google password.
- **Sender identity:** `CONTACT_FROM_EMAIL` is optional and defaults to
  `SMTP_USER`. Use the authenticated address or an SMTP-approved alias.
- **Portfolio recipient:** `CONTACT_TO_EMAIL` is optional and defaults to the
  email in the saved profile.
- **Admin replies:** use the same SMTP credentials; the admin must also sign in
  with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.

Keep all credentials in the untracked `.env.local` file or your hosting
provider's secret settings. Never commit real credentials.

## GitHub data

The homepage loads up to five recent, non-fork public repositories through a
cached API route. Configure `GITHUB_TOKEN` to also show the contribution
calendar and pinned repositories via GitHub GraphQL. Without a token, recent
public repositories still appear and the page explains why private activity
data is unavailable. The portfolio profile link remains available if GitHub
is unreachable.

## Editing content

- Use `/admin` for live content editing. `data/site.ts` and `data/projects.ts`
  provide the initial content when no saved JSON file exists.
- Project detail routes and sitemap entries are generated from saved projects.
- JB Solar is intentionally a redacted enterprise case study; only add
  confirmed stack, modules, or responsibilities.
- Replace the profile-photo and project screenshot placeholders with real
  images when available.
- Upload the current résumé from **Admin → Profile**, or replace
  `public/resume.pdf` directly.
- Replace the deployment domain in `NEXT_PUBLIC_SITE_URL` before publishing.

## Validation and deployment

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

Use `⌘K` / `Ctrl+K` to open the command palette and the backtick key to open
the terminal easter egg (`help`, `about`, `projects`, `skills`, `contact`,
`theme`). The mobile navigation is expandable and marks the active section.
Reduce-motion preferences bypass the preloader and role scrambler.

Set the environment variables above in the Node.js host. On Vercel, configure
MongoDB Atlas using the steps above to enable persistent admin editing, contact
inbox storage, and résumé uploads.
