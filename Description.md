# ROLE
You are a senior creative developer and art director. Build a one-of-a-kind developer portfolio in Next.js. It must NOT look like a template or AI-generated site. It should feel designed by a person with a point of view. Work step by step and create all files.

# CREATIVE CONCEPT: "THE ENGINEER'S LOGBOOK"
The portfolio is a living engineer's logbook / control-room console: editorial print design crossed with a terminal. Confident, a little playful, and tactile. Every section is a numbered "entry" (01 / ABOUT, 02 / WORK ...).

## Visual language
- **Palette (only these, no extra gradients):**
  - Light (default): paper `#F1EEE4`, ink `#111110`, signal orange `#FF4F1F`, muted `#8C8A80`
  - Dark: ink `#0F0F0E` background, paper text, same signal orange (inverted, not a different design)
- **Typography is the hero:**
  - Display: huge condensed or tight grotesk (Anton, Bricolage Grotesque, or Archivo Expanded), set at 12-18vw in the hero, uppercase, tight leading
  - Accent: one italic serif (Instrument Serif) used for single emphasized words inside headlines
  - Labels and meta: monospace (JetBrains Mono / Geist Mono), small, uppercase, wide tracking
- **Structure:** visible 12-column grid lines, hairline borders, crosshair `+` markers at section corners, index numbers, coordinates (18.68°N 75.33°E Pandharpur), and a live IST clock in the nav
- **Surfaces:** flat, hard-edged, 1px ink borders, hard offset shadows (`4px 4px 0 ink`). No glassmorphism, no blur, no soft glows, no rounded-everything, no purple/cyan gradients, no bento-box grid.
- **Texture:** subtle film grain overlay (SVG noise, 4-6% opacity) and a paper feel
- **Icons:** minimal custom line icons or text-only. No emoji and no generic icon-in-circle cards.

## Anti-patterns (do NOT do)
- Centered "Hi, I'm ___ 👋" hero
- Identical rounded cards with an icon, title, and paragraph
- Fade-up-on-scroll applied to every element
- Gradient text, gradient blobs, glowing orbs
- Percentage skill bars, or "passionate developer" filler copy
- Lorem ipsum or invented metrics

# MOTION DIRECTION (purposeful, not decorative)
- **Preloader:** a 2-second boot sequence ("> booting logbook... loading entries... ready") that wipes away with a clip-path reveal
- **Hero:** name split by character, rising from a masked line with stagger; a role scrambler that decodes text (`ENGINEER → FULL STACK → MOBILE → AI TOOLS`)
- **Custom cursor (desktop):** small ink dot that grows into a labeled circle ("VIEW", "OPEN", "DRAG") over interactive elements
- **Horizontal scroll work section:** pinned, projects as wide "case file" panels with big index numbers, scroll-driven parallax on the screenshots (GSAP ScrollTrigger + Lenis)
- **Marquee:** an oversized, skewed tech-stack ticker that reverses direction on scroll direction change
- **Hover:** links get a rolling-text swap (text slides up, duplicate slides in); project rows reveal a floating image that follows the cursor with inertia
- **Section transitions:** clip-path wipes and page transitions with a signal-orange sweep
- **Command palette (Cmd/Ctrl + K):** navigate sections, open projects, toggle theme, copy email, download resume
- **Easter egg:** typing a backtick opens a small terminal (`help`, `about`, `projects`, `skills`, `contact`, `theme`) built with real commands
- Animate transform/opacity/clip-path only, 0.4-0.9s, one shared easing set in `lib/motion.ts` (e.g., `cubic-bezier(0.76, 0, 0.24, 1)`)
- Respect `prefers-reduced-motion` (no preloader, no scramble, no pinned scroll; simple fades)

# ABOUT ME (real data, use exactly this)
- **Name:** Prathamesh Mane
- **Title:** System Engineer at TCS | Full Stack Developer (MERN & Java Fullstack)
- **Location:** Pandharpur, Maharashtra, India
- **Email:** maneprathamesh019@gmail.com | **Phone:** 8788761515
- **GitHub:** https://github.com/prathameshmane019
- **LinkedIn:** https://linkedin.com/in/prathamesh-mane-2308a5241
- **Bio (rewrite in a confident, human voice, first person, no buzzwords):** Full stack developer who ships web and mobile products end to end. Currently a System Engineer at TCS, building an ERP platform and mobile app for a solar business. Works across React, Next.js, React Native, Node.js, and databases, plus Docker, CI/CD, and NGINX to get things live.
- **Resume:** `public/resume.pdf`

## Experience (timeline, newest first)
1. **Tata Consultancy Services (TCS), System Engineer, April 2026 to Present**
   - Built **JB Solar ERP**: a web platform and mobile app to manage solar plant maintenance and service operations, including service policy management and related modules
   - `[TODO: add 2-4 real bullets on modules, your role, and tech stack, in your own words]`
2. **LeadSoft IT Solutions, Full Stack Development Intern** `[TODO: dates]`
   - Built web apps and responsive interfaces with React and JavaScript
   - Worked with databases and API integrations

## Projects (data in `data/projects.ts`, detail pages at `/projects/[slug]`)
0. **JB Solar ERP** (professional, TCS): web platform + mobile app for solar maintenance and service-policy management. Mark as "Client / Enterprise work: details limited". Use an abstract or redacted visual, not real screenshots. `[TODO: stack, modules]`
1. **EduMatrix: College ERP**: https://edumatrix.vercel.app. RBAC with multiple roles, React Native mobile app, modules for Attendance, Student Feedback, Faculty Management. Stack: Next.js, Node.js, Express, MongoDB, React Native, Tailwind.
2. **SwasthyaSamriddhi: Healthcare Platform**: https://swasthya-samriddhi.vercel.app. Centralized health records with secure, consent-based data sharing. Stack: Next.js, MongoDB, Tailwind, Redux, Cloudinary.
3. **DataFlux AI Agent**: https://github.com/prathameshmane019/MCPAIAGENT. AI agent for database exploration over streamable HTTP transport, with Gemini for natural-language understanding and dynamic tool calling. Stack: Next.js, Node.js, Express, MongoDB, MCP Protocol, Gemini API.
4. **Suhani Travels: Bus Ticket Booking**: https://suhanitravels.vercel.app. Real-time seat selection and availability, payment gateway integration. Stack: Next.js, Node.js, Express, MongoDB, Tailwind, Redux, Shadcn UI.

Case-study page layout (editorial, not generic): giant title, a meta strip (Role / Year / Stack / Link), then alternating text and image blocks, "Problem → Build → Learned" sections, and a next-project footer link. Placeholder images marked `[TODO: real screenshots]`. Do not invent metrics.

## Skills (show as a typographic index list, not cards)
- Languages: Java, JavaScript, TypeScript, Python, C
- Frontend: React.js, Next.js, React Native, HTML5, CSS3, Tailwind CSS
- Backend: Node.js, Express.js, REST APIs, WebSockets
- Databases: MongoDB, Oracle SQL, PostgreSQL, Redis
- DevOps/Tools: Docker, GitHub Actions, Linux, CI/CD
- Cloud/Infra: NGINX, AWS (basic), Reverse Proxy, Load Balancing
Presentation: a large list where hovering a category dims the others and highlights its items in signal orange, plus the marquee.

## Education, Certification, Achievements
- B.Tech Electronics & Telecommunication, SKN Sinhgad College of Engineering, 2025, CGPA 9.5/10
- Higher Secondary, Vasantarav Kale Jr. College, Pandharpur, 2021, 84.66%
- Oracle Cloud Infrastructure (OCI) Generative AI Professional, 2025
- Winner, Hackathon 2k24 (SKNSCOE); Runner-up, Hackathon 2k23 (SKNSCOE)
Present achievements as stamped "tickets" or rubber-stamp badges, slightly rotated, that straighten on hover.

# SECTIONS (each styled as a numbered logbook entry)
- **00 Preloader**
- **Nav:** wordmark "PM®", live IST clock, rolling-text links, theme toggle, command-palette hint (⌘K)
- **01 Hero:** massive name, scrambling role line, one-sentence intro, "Currently: System Engineer @ TCS" status chip with a pulsing dot, scroll cue
- **02 About:** two-column editorial layout, photo with a halftone/duotone treatment (placeholder `[TODO: photo]`), short bio, a "now" block (working on / learning / open to), true stats only (5 projects, 2 hackathon podiums, 9.5 CGPA, 1 certification)
- **03 Work:** pinned horizontal case files, then a plain index table of all projects below
- **04 Stack:** skills index + marquee
- **05 Experience:** vertical timeline drawn on scroll with SVG path, TCS first
- **06 Recognition:** stamps for hackathons and the Oracle certification
- **07 GitHub:** contribution graph + pinned repos via GitHub API (ISR), styled in the ink/orange palette
- **08 Contact:** gigantic "LET'S BUILD SOMETHING" with the email as a magnetic link, a minimal underline-only form (React Hook Form + Zod, honeypot, rate limit, Resend), status line "Open to opportunities" `[TODO: confirm]`
- **Footer:** marquee of the name, socials, back-to-top, local time, "Designed & built by Prathamesh"
- Custom 404 in logbook style ("ENTRY NOT FOUND"), loading and error states

# TECH STACK
Next.js 15 App Router, TypeScript strict, Tailwind CSS v4 with CSS variable tokens, Framer Motion for UI animation, GSAP + ScrollTrigger for pinned and scroll-driven sections, Lenis smooth scroll (synced with GSAP ticker), next-themes, `cmdk` for the command palette, React Hook Form + Zod, Resend, next/font, next/image, ESLint + Prettier, `@/` imports.
No component-library look: if using shadcn/Radix, restyle fully to the hard-edge design system (or use only for accessibility primitives).

# ARCHITECTURE
`app/`, `components/ui|sections|shared/`, `data/` (typed: projects, skills, experience, education, achievements, socials, site-config), `lib/` (motion.ts, utils, validators), `hooks/`, `types/`. Server Components by default; Client Components only for interaction. Lazy-load GSAP-heavy sections with `next/dynamic`. `.env.example` included.

# QUALITY
- Mobile-first, 360px to 4K. On mobile: disable the custom cursor and horizontal pin (use a vertical stack with snap), and keep type scales fluid with `clamp`
- Accessibility: semantic HTML, keyboard navigation, focus-visible rings in signal orange, WCAG AA contrast, skip link, reduced motion respected
- SEO: metadata API, dynamic OG image in logbook style, sitemap, robots, JSON-LD Person
- Performance: Lighthouse 90+, no layout shift, fonts preloaded, effects capped for low-end devices
- Clean, typed, commented code, no `any`

# ORDER OF WORK
1. Setup commands and dependencies
2. Design tokens, fonts, grid overlay, grain, global styles
3. Primitives (RollingLink, Magnetic, Stamp, SectionLabel, Cursor, Marquee) and `lib/motion.ts`
4. Layout: preloader, nav with clock, theme, Lenis, command palette, terminal easter egg
5. Sections in order, using the real data above
6. Project detail pages, contact API, SEO, 404
7. Polish pass: responsiveness, reduced motion, accessibility, performance
8. `README.md`: editing content, adding projects, deploying to Vercel

Start with step 1 and continue until complete. After each step, tell me what to preview. Ask only if blocked.

