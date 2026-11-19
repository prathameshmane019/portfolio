export const profile = {
  name: "Prathamesh Mane",
  title: "System Engineer at TCS | Full Stack Developer (MERN & Java Fullstack)",
  tagline: "I ship web and mobile products end to end.",
  bio: "I build web and mobile products from start to finish. I’m currently a System Engineer at TCS, working on an ERP platform and mobile app for a solar business. I work across React, Next.js, React Native, Node.js, and databases, then use Docker, CI/CD, and NGINX to get products live.",
  location: "Pandharpur, Maharashtra, India",
  coordinates: "18.68°N 75.33°E",
  phone: "8788761515",
  email: "maneprathamesh019@gmail.com",
  github: "https://github.com/prathameshmane019",
  linkedin: "https://linkedin.com/in/prathamesh-mane-2308a5241",
  resume: "/resume.pdf",
  currentFocus: "JB Solar ERP / TCS",
  learning: "",
  availability: "",
} as const;

export const skillGroups = [
  { name: "Languages", number: "01", skills: ["Java", "JavaScript", "TypeScript", "Python", "C"] },
  { name: "Frontend", number: "02", skills: ["React.js", "Next.js", "React Native", "HTML5", "CSS3", "Tailwind CSS"] },
  { name: "Backend", number: "03", skills: ["Node.js", "Express.js", "REST APIs", "WebSockets"] },
  { name: "Databases", number: "04", skills: ["MongoDB", "Oracle SQL", "PostgreSQL", "Redis"] },
  { name: "DevOps / Tools", number: "05", skills: ["Docker", "GitHub Actions", "Linux", "CI/CD"] },
  { name: "Cloud / Infra", number: "06", skills: ["NGINX", "AWS (basic)", "Reverse Proxy", "Load Balancing"] },
] as const;

export const experience = [
  {
    type: "work",
    title: "System Engineer",
    organization: "Tata Consultancy Services (TCS)",
    date: "April 2026 — Present",
    details: [
      "Built JB Solar ERP, a web platform and mobile app for solar plant maintenance and service operations.",
      "Worked on service policy management and related modules.",
      "[TODO: add 2–4 real bullets on modules, your role, and tech stack]",
    ],
  },
  {
    type: "work",
    title: "Full Stack Development Intern",
    organization: "LeadSoft IT Solutions",
    date: "[TODO: add dates]",
    details: [
      "Built web applications and responsive interfaces with React and JavaScript.",
      "Worked with databases and API integrations.",
    ],
  },
] as const;

export const education = [
  {
    title: "B.Tech, Electronics & Telecommunication",
    organization: "SKN Sinhgad College of Engineering",
    date: "2025",
    detail: "CGPA 9.5 / 10",
  },
  {
    title: "Higher Secondary",
    organization: "Vasantarav Kale Jr. College, Pandharpur",
    date: "2021",
    detail: "84.66%",
  },
] as const;

export const achievements = [
  { type: "Hackathon", title: "Winner", detail: "Hackathon 2k24", organization: "SKNSCOE", mark: "01" },
  { type: "Hackathon", title: "Runner-up", detail: "Hackathon 2k23", organization: "SKNSCOE", mark: "02" },
  { type: "Certification", title: "OCI Generative AI Professional", detail: "Oracle Cloud Infrastructure", organization: "2025", mark: "03" },
] as const;

export const stats = [
  { value: 5, suffix: "", label: "Projects" },
  { value: 2, suffix: "", label: "Hackathon podiums" },
  { value: 9.5, suffix: "", label: "CGPA / 10", decimals: 1 },
  { value: 1, suffix: "", label: "Certification" },
] as const;
