"use client";

import Link from "next/link";
import {
  FormEvent,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Project } from "@/data/projects";
import type { PortfolioContent } from "@/lib/content-store";

const navigation = [
  ["02", "About", "#about"],
  ["03", "Work", "#work"],
  ["04", "Stack", "#stack"],
  ["05", "Experience", "#experience"],
  ["08", "Contact", "#contact"],
] as const;

const roles = ["ENGINEER", "FULL STACK", "MOBILE", "AI TOOLS"];

type GitHubActivityData = {
  repositories: {
    name: string;
    description: string | null;
    html_url: string;
    language: string | null;
  }[];
  pinnedRepositories: {
    name: string;
    description: string | null;
    url: string;
    primaryLanguage: { name: string } | null;
  }[] | null;
  contributionCalendar: {
    totalContributions: number;
    weeks: { contributionDays: { contributionCount: number; date: string; color: string }[] }[];
  } | null;
  activityError: string;
};

function Arrow({ direction = "right" }: { direction?: "right" | "up" | "left" }) {
  const paths = {
    right: "M3 8h10m-4-4 4 4-4 4",
    left: "M13 8H3m4-4L3 8l4 4",
    up: "M4 12 12 4m-7 0h7v7",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="arrow-icon">
      <path d={paths[direction]} />
    </svg>
  );
}

function EntryLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="entry-label">
      <span>{number}</span>
      <span aria-hidden="true">/</span>
      <h2>{children}</h2>
    </div>
  );
}

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [count, setCount] = useState(0);
  const node = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setCount(value);
        return;
      }
      const start = performance.now();
      const tick = (time: number) => {
        const progress = Math.min((time - start) / 800, 1);
        setCount(value * progress);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return <span ref={node}>{count.toFixed(decimals)}</span>;
}

function ProjectVisual({ project }: { project: Project }) {
  return (
    <div className={`case-visual ${project.visual}`} aria-hidden="true">
      {project.confidential ? (
        <div className="redacted-sheet">
          <span>CLIENT / ENTERPRISE WORK</span>
          <strong>{project.shortTitle.toUpperCase()}</strong>
          <i />
          <i />
          <i />
          <div className="redaction-bars"><b /><b /><b /></div>
          <small>DETAILS LIMITED</small>
        </div>
      ) : (
        <div className="case-screen">
          <div className="case-screen-head">
            <span>◦ ◦ ◦</span>
            <span>{project.shortTitle}</span>
            <span>PM / LAB</span>
          </div>
          <div className="case-screen-body">
            <span className="case-block block-wide" />
            <span className="case-block block-short" />
            <div className="case-mini-grid"><i /><i /><i /><i /></div>
          </div>
        </div>
      )}
      <span className="visual-caption">
        {project.confidential
          ? "CLIENT VISUAL / DETAILS LIMITED"
          : `FIG. ${project.number} — [TODO: real screenshots]`}
      </span>
      <span className="crosshair crosshair-top">+</span>
      <span className="crosshair crosshair-bottom">+</span>
    </div>
  );
}

function ProjectCase({ project, onOpen }: { project: Project; onOpen: (label: string) => void }) {
  return (
    <article className="case-file">
      <Link
        className="case-file-link"
        href={`/projects/${project.slug}`}
        onMouseEnter={() => onOpen("OPEN")}
        onMouseLeave={() => onOpen("")}
        aria-label={`Open ${project.title} case study`}
      >
        <ProjectVisual project={project} />
        <div className="case-file-meta">
          <span>{project.category.join(" / ")}</span>
          <span>{project.year}</span>
        </div>
        <h3>{project.shortTitle}</h3>
        <p>{project.description}</p>
        <span className="case-file-action">OPEN CASE FILE <Arrow direction="up" /></span>
      </Link>
    </article>
  );
}

function GitHubActivity({ profile }: { profile: PortfolioContent["profile"] }) {
  const [data, setData] = useState<GitHubActivityData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/github", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load public GitHub data");
        return (await response.json()) as GitHubActivityData;
      })
      .then(setData)
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(true);
      });
    return () => controller.abort();
  }, []);

  const repos = data?.pinnedRepositories
    ? data.pinnedRepositories.map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.url,
        language: repo.primaryLanguage?.name || "—",
      }))
    : data?.repositories.map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language || "—",
      }));

  return (
    <section className="log-section github-section" id="github">
      <div className="page-shell">
        <EntryLabel number="07">GITHUB / FIELD NOTES</EntryLabel>
        <div className="github-layout">
          <div className="github-copy">
            <p className="mono-label">PUBLIC ACTIVITY / LAST 12 MONTHS</p>
            {data?.contributionCalendar ? (
              <p className="contribution-total">
                <strong>{data.contributionCalendar.totalContributions}</strong> contributions
              </p>
            ) : (
              <p className="contribution-total">A live window into my code.</p>
            )}
            <a className="text-link" href={profile.github} target="_blank" rel="noreferrer">
              GITHUB PROFILE <Arrow direction="up" />
            </a>
          </div>
          <div className="github-data">
            {data?.contributionCalendar && (
              <div className="contribution-grid" role="img" aria-label={`${data.contributionCalendar.totalContributions} GitHub contributions in the last year`}>
                {data.contributionCalendar.weeks.map((week, index) => (
                  <span className="contribution-week" key={`w${index}`}>
                    {week.contributionDays.map((day) => (
                      <i key={day.date} title={`${day.contributionCount} contributions · ${day.date}`} style={{ backgroundColor: day.color }} />
                    ))}
                  </span>
                ))}
              </div>
            )}
            <div className="repo-heading">
              <span>{data?.pinnedRepositories ? "PINNED REPOSITORIES" : "RECENT PUBLIC REPOSITORIES"}</span>
              <span>{error ? "UNAVAILABLE" : data ? "LIVE DATA" : "CONNECTING..."}</span>
            </div>
            {repos?.length ? (
              <ul className="repo-list">
                {repos.slice(0, 4).map((repo, index) => (
                  <li key={repo.name}>
                    <a href={repo.url} target="_blank" rel="noreferrer">
                      <span className="repo-index">0{index + 1}</span>
                      <span className="repo-name">{repo.name}</span>
                      <span className="repo-language">{repo.language}</span>
                      <Arrow direction="up" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="github-status">
                {error ? "GitHub data is temporarily unavailable." : data?.activityError || "Loading GitHub data…"}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

type PaletteAction = "navigate" | "theme" | "copy" | "resume";
type PaletteCommand = { label: string; detail: string; action: PaletteAction; target: string };
const paletteCommands: PaletteCommand[] = [
  { label: "Go to About", detail: "01 / ABOUT", action: "navigate", target: "#about" },
  { label: "Go to Work", detail: "02 / WORK", action: "navigate", target: "#work" },
  { label: "Go to Stack", detail: "03 / STACK", action: "navigate", target: "#stack" },
  { label: "Go to Experience", detail: "04 / EXPERIENCE", action: "navigate", target: "#experience" },
  { label: "Go to Contact", detail: "08 / CONTACT", action: "navigate", target: "#contact" },
  { label: "Toggle light / dark theme", detail: "APPEARANCE", action: "theme", target: "" },
  { label: "Copy email address", detail: "CONTACT", action: "copy", target: "" },
  { label: "Download résumé", detail: "PDF", action: "resume", target: "" },
];

export function Portfolio({ content }: { content: PortfolioContent }) {
  const { profile, skillGroups, experience, education, achievements, stats, projects } = content;
  const marqueeSkills = skillGroups.flatMap((group) => group.skills).slice(0, 8).map((skill) => skill.toUpperCase());
  const initials = profile.name.split(/\s+/).map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
  const [booting, setBooting] = useState(true);
  const [role, setRole] = useState(roles[0]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [clock, setClock] = useState("--:--:--");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState("");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>(["LOGBOOK TERMINAL · TYPE HELP"]);
  const [formState, setFormState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formFeedback, setFormFeedback] = useState("");
  const [cursorLabel, setCursorLabel] = useState("");
  const [workIndex, setWorkIndex] = useState(0);
  const [activeSection, setActiveSection] = useState("top");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const paletteInput = useRef<HTMLInputElement>(null);
  const workTrack = useRef<HTMLDivElement>(null);
  const workStage = useRef<HTMLDivElement>(null);
  const marqueeSection = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const timeout = window.setTimeout(() => setBooting(false), 2000);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const sections = ["top", "about", "work", "stack", "experience", "contact"]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.2, 0.5] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date()));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let roleIndex = 0;
    const interval = window.setInterval(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      const next = roles[roleIndex];
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setRole(next);
        return;
      }
      let step = 0;
      const reveal = window.setInterval(() => {
        step += 1;
        const shown = next.slice(0, step);
        const noise = Array.from({ length: Math.max(next.length - step, 0) }, (_, index) =>
          "01#%*"[((index + step) * 7) % 5],
        ).join("");
        setRole(shown + noise);
        if (step >= next.length) {
          window.clearInterval(reveal);
          setRole(next);
        }
      }, 28);
    }, 3500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    paletteInput.current?.focus();
  }, [paletteOpen]);

  useEffect(() => {
    const keydown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        setTerminalOpen(false);
      } else if (event.key === "`" && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        setTerminalOpen((open) => !open);
        setPaletteOpen(false);
      } else if (event.key === "Escape") {
        setPaletteOpen(false);
        setTerminalOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => {
      document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    };
    const over = (event: globalThis.PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const interactive = target.closest<HTMLElement>("[data-cursor]");
      setCursorLabel(interactive?.dataset.cursor || "");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
    };
  }, []);

  useEffect(() => {
    const track = workTrack.current;
    const stage = workStage.current;
    if (!track || !stage) return;
    const viewport = track.parentElement;
    if (!viewport) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const measure = () => {
      if (window.innerWidth <= 640 || reduceMotion.matches) {
        stage.style.height = "auto";
        track.style.transform = "";
        return;
      }
      const horizontalDistance = Math.max(track.scrollWidth - viewport.clientWidth, 0);
      stage.style.height = `${window.innerHeight + horizontalDistance}px`;
    };

    let frame = 0;
    const updateScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (window.innerWidth <= 640 || reduceMotion.matches) return;
        const horizontalDistance = Math.max(track.scrollWidth - viewport.clientWidth, 0);
        const scrollDistance = Math.max(stage.offsetHeight - window.innerHeight, 1);
        const progress = Math.max(0, Math.min(-stage.getBoundingClientRect().top / scrollDistance, 1));
        track.style.transform = `translate3d(${-horizontalDistance * progress}px, 0, 0)`;
      });
    };

    measure();
    updateScroll();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", updateScroll, { passive: true });

    const updateIndex = () => {
      const card = track.querySelector<HTMLElement>(".case-file");
      if (!card) return;
      const step = card.offsetWidth + 18;
      const horizontalDistance = Math.max(track.scrollWidth - (viewport.clientWidth || 1), 0);
      const progress = horizontalDistance > 0
        ? Math.max(0, Math.min(-stage.getBoundingClientRect().top / Math.max(stage.offsetHeight - window.innerHeight, 1), 1))
        : 0;
      setWorkIndex(Math.round((horizontalDistance * progress) / step));
    };
    window.addEventListener("scroll", updateIndex, { passive: true });
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("scroll", updateIndex);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    let previousY = window.scrollY;
    const updateDirection = () => {
      const currentY = window.scrollY;
      marqueeSection.current?.setAttribute(
        "data-direction",
        currentY < previousY ? "up" : "down",
      );
      previousY = currentY;
    };
    window.addEventListener("scroll", updateDirection, { passive: true });
    return () => window.removeEventListener("scroll", updateDirection);
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty(
        "--scroll-progress",
        String(maxScroll > 0 ? window.scrollY / maxScroll : 0),
      );
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
  }

  function runPaletteCommand(command: PaletteCommand) {
    setPaletteOpen(false);
    setPaletteSearch("");
    if (command.action === "navigate") {
      document.querySelector(command.target)?.scrollIntoView({ behavior: "smooth" });
    } else if (command.action === "theme") {
      toggleTheme();
    } else if (command.action === "resume") {
      document.querySelector<HTMLAnchorElement>(".hero-resume")?.click();
    } else if (command.action === "copy") {
      void navigator.clipboard.writeText(profile.email);
      setTerminalOutput(["EMAIL COPIED TO CLIPBOARD"]);
    }
  }

  function executeTerminal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const command = terminalInput.trim().toLowerCase();
    setTerminalInput("");
    const commands: Record<string, string> = {
      help: "AVAILABLE: help · about · projects · skills · contact · theme",
      about: `${profile.name} · ${profile.title} · ${profile.location}.`,
      projects: "Opening work entries…",
      skills: "Opening stack index…",
      contact: "Opening contact entry…",
      theme: "Switching logbook appearance.",
    };
    setTerminalOutput((output) => [...output, `> ${command}`, commands[command] || "UNKNOWN COMMAND · TYPE HELP"]);
    if (command === "projects") document.querySelector("#work")?.scrollIntoView({ behavior: "smooth" });
    if (command === "skills") document.querySelector("#stack")?.scrollIntoView({ behavior: "smooth" });
    if (command === "contact") document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
    if (command === "theme") toggleTheme();
  }

  function moveWork(direction: -1 | 1) {
    const track = workTrack.current;
    const stage = workStage.current;
    const card = track?.querySelector<HTMLElement>(".case-file");
    const viewport = track?.parentElement;
    if (!track || !stage || !card || !viewport || window.innerWidth <= 640) return;
    const horizontalDistance = Math.max(track.scrollWidth - viewport.clientWidth, 0);
    const scrollDistance = Math.max(stage.offsetHeight - window.innerHeight, 0);
    if (horizontalDistance === 0 || scrollDistance === 0) return;
    const step = card.offsetWidth + 18;
    const nextIndex = Math.max(0, Math.min(workIndex + direction, projects.length));
    const progress = Math.min((nextIndex * step) / horizontalDistance, 1);
    const stageTop = window.scrollY + stage.getBoundingClientRect().top;
    window.scrollTo({
      top: stageTop + scrollDistance * progress,
      behavior: "smooth",
    });
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setFormState("sending");
    setFormFeedback("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          email: values.get("email"),
          message: values.get("message"),
          website: values.get("website"),
        }),
      });
      const result = await response.json() as {
        delivery?: { ownerNotified: boolean; senderAcknowledged: boolean; statusSaved?: boolean };
      };
      if (!response.ok) throw new Error("Contact request failed");
      setFormFeedback(
        result.delivery?.statusSaved === false
          ? "Your message is saved, but email delivery status could not be recorded. Please email me directly to confirm."
          : result.delivery?.ownerNotified && result.delivery.senderAcknowledged
          ? "A copy was saved, and a confirmation email is on its way."
          : "Your message was saved, but email delivery is incomplete. You can also reach me directly below.",
      );
      setFormState("success");
      form.reset();
    } catch {
      setFormState("error");
    }
  }

  const filteredCommands = paletteCommands.filter((command) =>
    `${command.label} ${command.detail}`.toLowerCase().includes(paletteSearch.toLowerCase()),
  );

  function onPaletteKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const buttons = Array.from(
        document.querySelectorAll<HTMLButtonElement>(".palette-results button"),
      );
      if (!buttons.length) return;
      const focusedIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const nextIndex = event.key === "ArrowDown"
        ? (focusedIndex + 1) % buttons.length
        : focusedIndex < 0
          ? buttons.length - 1
          : (focusedIndex - 1 + buttons.length) % buttons.length;
      buttons[nextIndex].focus();
    } else if (event.key === "Enter" && event.target === paletteInput.current && filteredCommands[0]) {
      event.preventDefault();
      runPaletteCommand(filteredCommands[0]);
    }
  }

  function setCursorFromPointer(event: ReactPointerEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    setCursorLabel(target.closest<HTMLElement>("[data-cursor]")?.dataset.cursor || "");
  }

  return (
    <>
      <a className="skip-link" href="#main">SKIP TO CONTENT</a>
      <div className={`preloader${booting ? " preloader-active" : ""}`} aria-hidden={!booting}>
        <div className="preloader-copy">
          <p>&gt; booting logbook<span className="load-dots">...</span></p>
          <p>&gt; loading entries<span className="load-dots">...</span></p>
          <p>&gt; ready<span className="load-cursor">_</span></p>
        </div>
        <span className="preloader-index">{initials} / SYSTEM LOG 001</span>
      </div>

      <div className="cursor-label" aria-hidden="true">{cursorLabel}</div>

      <header className="site-header">
        <div className="header-inner">
          <a href="#top" className="wordmark" aria-label={`${profile.name} home`} data-cursor="HOME">{initials}<span>®</span></a>
          <nav className={`nav-links${mobileMenuOpen ? " nav-links-open" : ""}`} id="main-navigation" aria-label="Main navigation">
            {navigation.map(([number, label, href]) => (
              <a href={href} key={href} data-cursor="GO" aria-current={activeSection === href.slice(1) ? "location" : undefined} onClick={() => setMobileMenuOpen(false)}>
                <span className="nav-number">{number}</span>
                <span className="rolling-link"><span>{label}</span><span aria-hidden="true">{label}</span></span>
              </a>
            ))}
          </nav>
          <div className="header-tools">
            <button type="button" className="mobile-menu-toggle" aria-expanded={mobileMenuOpen} aria-controls="main-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
              {mobileMenuOpen ? "CLOSE" : "MENU"}
            </button>
            <span className="clock-readout"><i /> IST <time>{clock}</time></span>
            <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} data-cursor="SWITCH">
              {theme === "light" ? "DARK" : "LIGHT"}
            </button>
            <button type="button" className="palette-trigger" onClick={() => setPaletteOpen(true)} aria-label="Open command palette" data-cursor="OPEN">
              <span>⌘ K</span>
            </button>
          </div>
        </div>
      </header>
      <div className="scroll-progress" aria-hidden="true"><span /></div>

      <main id="main" onPointerOver={setCursorFromPointer}>
        <section className="hero-entry" id="top">
          <span className="hero-coordinate">{profile.coordinates}<br />{profile.location.toUpperCase()}</span>
          <div className="hero-main page-shell">
            <div className="hero-indexline">
              <span>PERSONAL ENGINEERING LOG</span>
              <span>VOL. 01 — 2026</span>
            </div>
            <h1 className="hero-name" aria-label={profile.name}>
              <span className="name-line">{Array.from((profile.name.split(/\s+/)[0] || profile.name).toUpperCase()).map((letter, index) => <span className="letter-mask" key={`${letter}-${index}`}><i style={{ animationDelay: `${index * 35}ms` }}>{letter}</i></span>)}</span>
              <span className="name-line name-second">{Array.from(profile.name.split(/\s+/).slice(1).join(" ").toUpperCase()).map((letter, index) => <span className="letter-mask" key={`${letter}-${index}`}><i style={{ animationDelay: `${(index + 10) * 35}ms` }}>{letter}</i></span>)}<em>®</em></span>
            </h1>
            <div className="hero-bottom">
              <div className="role-line"><span className="signal-mark">[</span> <span className="role-scramble" aria-live="polite">{role}</span> <span className="signal-mark">]</span></div>
              <p className="hero-tagline">{profile.tagline} {profile.currentFocus && <span>Currently: {profile.currentFocus}.</span>}</p>
              <a className="hero-resume" href={profile.resume} download data-cursor="DOWNLOAD">DOWNLOAD RÉSUMÉ ↗</a>
              <a className="scroll-cue" href="#about"><span className="scroll-rule" /> SCROLL TO READ <span>↓</span></a>
              <span className="hero-entry-id">ENTRY Nº 001 / 2026</span>
            </div>
          </div>
          <span className="hero-cross cross-left">+</span><span className="hero-cross cross-right">+</span>
        </section>

        <section className="log-section about-section" id="about">
          <div className="page-shell">
            <EntryLabel number="02">ABOUT / THE OPERATOR</EntryLabel>
            <div className="about-layout">
              <div className="portrait-frame" role="img" aria-label="Profile photograph placeholder">
                <div className="portrait-halftone"><span>PM</span></div>
                <span className="portrait-note">[TODO: PHOTO]</span>
                <span className="portrait-code">PM—001 / FIG. A</span>
                <span className="crosshair portrait-cross">+</span>
              </div>
              <div className="about-copy">
                <h2>Full stack developer.<br /><em>End to end.</em></h2>
                <p className="about-bio">{profile.bio}</p>
                <div className="now-block">
                  <div className="now-title"><span className="status-dot" /> RIGHT NOW</div>
                    <div className="now-row"><span>WORKING ON</span><strong>{profile.currentFocus || "—"}</strong></div>
                    {profile.learning && <div className="now-row"><span>LEARNING</span><strong>{profile.learning}</strong></div>}
                    {profile.availability && <div className="now-row"><span>OPEN TO</span><strong>{profile.availability}</strong></div>}
                </div>
                <div className="stats-strip">
                  {stats.map((stat, index) => (
                    <div className="stat-cell" key={stat.label}>
                      <span className="stat-index">0{index + 1}</span>
                      <strong><CountUp value={stat.value} decimals={"decimals" in stat ? stat.decimals : 0} /></strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="log-section work-section" id="work">
          <div className="page-shell">
            <EntryLabel number="03">WORK / CASE FILES</EntryLabel>
            <div className="work-heading">
              <h2>Selected work.<br /><em>On the record.</em></h2>
              <div className="work-controls">
                    <span>SCROLL TO SCAN / {String(Math.min(workIndex + 1, projects.length)).padStart(2, "0")}—{String(projects.length).padStart(2, "0")}</span>
                <button type="button" onClick={() => moveWork(-1)} aria-label="Previous project" data-cursor="PREV">←</button>
                <button type="button" onClick={() => moveWork(1)} aria-label="Next project" data-cursor="NEXT">→</button>
              </div>
            </div>
          </div>
          <div className="case-stage" ref={workStage}>
            <div className="case-stage-viewport">
              <div className="case-track" ref={workTrack} aria-label="Project case file archive">
                {projects.map((project) => <ProjectCase key={project.slug} project={project} onOpen={setCursorLabel} />)}
                <a className="all-work-card" href="#project-index"><span>ALL ENTRIES</span><strong>Index <em>→</em></strong><span>SCROLL FOR PROJECT DIRECTORY</span></a>
              </div>
            </div>
          </div>
          <div className="page-shell">
            <div className="project-index" id="project-index">
              <div className="index-heading"><span>PROJECT INDEX</span>              <span>{String(projects.length).padStart(2, "0")} ENTRIES</span></div>
              {projects.map((project) => (
                <div className="project-row" key={project.slug}>
                  <span className="project-row-number">{project.number}</span>
                  <Link href={`/projects/${project.slug}`} data-cursor="OPEN">{project.shortTitle}</Link>
                  <span className="project-row-kind">{project.confidential ? "CLIENT / ENTERPRISE" : project.category.join(" · ").toUpperCase()}</span>
                  <span className="project-row-year">{project.year}</span>
                  <Link className="row-arrow" href={`/projects/${project.slug}`} aria-label={`Open ${project.shortTitle}`}><Arrow direction="up" /></Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="marquee-section" aria-label="Technology stack ticker" ref={marqueeSection}>
          <div className="marquee-track">
            {[0, 1, 2, 3].map((repeat) => (
              <span className="marquee-set" key={repeat}>
                {marqueeSkills.map((skill) => <span key={`${repeat}-${skill}`}>{skill}<i>+</i></span>)}
              </span>
            ))}
          </div>
        </section>

        <section className="log-section stack-section" id="stack">
          <div className="page-shell">
            <EntryLabel number="04">STACK / INDEX OF TOOLS</EntryLabel>
            <div className="stack-layout">
              <h2>The tools<br /><em>of the trade.</em></h2>
              <div className="stack-list">
                {skillGroups.map((group) => (
                  <div className="stack-row" key={group.name} tabIndex={0}>
                    <span className="stack-number">{group.number}</span>
                    <h3>{group.name}</h3>
                    <div className="stack-items">{group.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                    <span className="stack-cross">+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="log-section experience-section" id="experience">
          <div className="page-shell">
            <EntryLabel number="05">EXPERIENCE / FIELD LOG</EntryLabel>
            <div className="experience-layout">
              <h2>Work in<br /><em>the field.</em></h2>
              <div className="timeline">
                {experience.map((item, index) => (
                  <article className="timeline-row" key={item.organization}>
                    <span className="timeline-number">0{index + 1}</span>
                    <div className="timeline-content">
                      <div className="timeline-meta"><span>{item.organization}</span><time>{item.date}</time></div>
                      <h3>{item.title}</h3>
                      <ul>{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
                    </div>
                  </article>
                ))}
                {education.map((item, index) => (
                  <article className="timeline-row education-row" key={item.organization}>
                    <span className="timeline-number">E{index + 1}</span>
                    <div className="timeline-content">
                      <div className="timeline-meta"><span>EDUCATION / {item.organization}</span><time>{item.date}</time></div>
                      <h3>{item.title}</h3>
                      <p>{item.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="log-section recognition-section" id="recognition">
          <div className="page-shell">
            <EntryLabel number="06">RECOGNITION / STAMPS</EntryLabel>
            <div className="recognition-heading"><h2>Marks of<br /><em>the journey.</em></h2><p>{achievements.length} recorded recognitions.</p></div>
            <div className="stamp-list">
              {achievements.map((item) => (
                <article className="stamp-ticket" key={item.mark}>
                  <span className="stamp-number">{item.mark} / {item.type}</span>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  <span className="stamp-org">{item.organization}</span>
                  <span className="stamp-mark">VERIFIED</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <GitHubActivity profile={profile} />

        <section className="log-section contact-section" id="contact">
          <div className="page-shell">
            <EntryLabel number="08">CONTACT / OPEN CHANNEL</EntryLabel>
            <div className="contact-heading">
              <p className="contact-status"><span className="status-dot" /> {profile.availability ? `OPEN TO ${profile.availability.toUpperCase()}` : "OPEN CHANNEL / ENQUIRIES WELCOME"}</p>
              <h2>LET&apos;S BUILD<br /><em>SOMETHING.</em></h2>
              <a className="magnetic-email" href={`mailto:${profile.email}`} data-cursor="EMAIL">
                {profile.email} <Arrow direction="up" />
              </a>
              <p className="contact-phone">+91 {profile.phone} <span>/</span> {profile.location}</p>
            </div>
            <form className="contact-form" onSubmit={submitContact}>
              <div className="form-grid">
                <label>Name<input name="name" autoComplete="name" required maxLength={100} placeholder="Your name" /></label>
                <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
                <label className="message-label">Message<textarea name="message" rows={3} minLength={10} maxLength={4000} required placeholder="What are you building?" /></label>
                <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <div className="form-submit-row">
                <button type="submit" disabled={formState === "sending"} data-cursor="SEND">
                  {formState === "sending" ? "SENDING..." : "SEND MESSAGE"} <Arrow direction="up" />
                </button>
                <p className={`form-status form-${formState}`} aria-live="polite">
                  {formState === "success" && <>Message received. Thanks for getting in touch. {formFeedback}</>}
                  {formState === "error" && <>Could not send. Please email <a href={`mailto:${profile.email}`}>{profile.email}</a> directly.</>}
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-marquee"><span>{profile.name.toUpperCase()} · {profile.name.toUpperCase()} · </span><span aria-hidden="true">{profile.name.toUpperCase()} · {profile.name.toUpperCase()} · </span></div>
        <div className="page-shell footer-meta">
          <a href="#top" className="wordmark">{initials}<span>®</span></a>
          <span>DESIGNED &amp; BUILT BY {profile.name.toUpperCase()}</span>
          <div><a href={profile.github} target="_blank" rel="noreferrer">GITHUB <Arrow direction="up" /></a><a href={profile.linkedin} target="_blank" rel="noreferrer">LINKEDIN <Arrow direction="up" /></a></div>
          <a href="/admin/login">ADMIN ↗</a>
          <a href="#top">BACK TO TOP ↑</a>
          <span>{profile.location.toUpperCase()} / {clock} IST</span>
        </div>
      </footer>

      {paletteOpen && (
        <div className="overlay-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false); }}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-labelledby="palette-title" onKeyDown={onPaletteKeyDown}>
            <div className="palette-title" id="palette-title">COMMAND / SELECT ENTRY <button type="button" onClick={() => setPaletteOpen(false)}>ESC</button></div>
            <input ref={paletteInput} value={paletteSearch} onChange={(event) => setPaletteSearch(event.target.value)} placeholder="Search the logbook..." aria-label="Search commands" />
            <div className="palette-results">
              {filteredCommands.map((command) => (
                <button type="button" key={command.label} onClick={() => runPaletteCommand(command)}>
                  <span>{command.label}</span><small>{command.detail}</small><Arrow direction="up" />
                </button>
              ))}
              {filteredCommands.length === 0 && <p>NO MATCHING COMMANDS</p>}
            </div>
            <div className="palette-footer">↑ ↓ TO NAVIGATE <span>ENTER TO SELECT</span> <span>ESC TO CLOSE</span></div>
          </section>
        </div>
      )}

      {terminalOpen && (
        <div className="terminal-window" role="dialog" aria-modal="false" aria-label="Logbook terminal">
          <div className="terminal-bar"><span>PM — TERMINAL</span><button type="button" onClick={() => setTerminalOpen(false)} aria-label="Close terminal">×</button></div>
          <div className="terminal-history" aria-live="polite">{terminalOutput.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}</div>
          <form onSubmit={executeTerminal}><label htmlFor="terminal-command">&gt;</label><input id="terminal-command" autoFocus value={terminalInput} onChange={(event) => setTerminalInput(event.target.value)} placeholder="type a command..." /></form>
        </div>
      )}
    </>
  );
}
