export type ProjectCategory = "Full Stack" | "Web" | "AI" | "Mobile";

export type Project = {
  slug: string;
  title: string;
  shortTitle: string;
  category: ProjectCategory[];
  number: string;
  description: string;
  overview: string;
  features: string[];
  stack: string[];
  contribution: string[];
  challenge: string;
  solution: string;
  role: string;
  year: string;
  learned: string;
  confidential?: boolean;
  live?: string;
  github?: string;
  visual: string;
};

export const projects: Project[] = [
  {
    slug: "jb-solar-erp",
    title: "JB Solar ERP",
    shortTitle: "JB Solar ERP",
    category: ["Full Stack", "Web", "Mobile"],
    number: "00",
    description:
      "A web platform and mobile app for solar plant maintenance and service operations.",
    overview:
      "An enterprise ERP platform for a solar business, covering plant maintenance and service operations.",
    features: [
      "Web platform and mobile app",
      "Solar plant maintenance and service operations",
      "Service policy management and related modules",
      "[TODO: add confirmed modules]",
    ],
    stack: ["[TODO: confirm stack]"],
    contribution: [
      "Built as part of my System Engineer role at Tata Consultancy Services.",
      "Developed an ERP platform and mobile app for a solar business.",
      "[TODO: add confirmed responsibilities]",
    ],
    challenge:
      "The platform supports solar maintenance and service-policy workflows across a web application and mobile app.",
    solution:
      "Built an ERP platform and companion app. Further implementation details are limited because this is client / enterprise work.",
    role: "System Engineer · TCS",
    year: "2026 — Present",
    learned: "[TODO: add a genuine learning from this project]",
    confidential: true,
    visual: "project-solar",
  },
  {
    slug: "edumatrix",
    title: "EduMatrix: ERP System for College Institutes",
    shortTitle: "EduMatrix",
    category: ["Full Stack", "Web", "Mobile"],
    number: "01",
    description:
      "A comprehensive college ERP with web and mobile interfaces, designed around the everyday needs of an institute.",
    overview:
      "EduMatrix brings key college workflows together in one platform, with role-based access and a companion mobile experience.",
    features: [
      "Role-based access control for multiple user roles",
      "Attendance management",
      "Student feedback",
      "Faculty management",
      "React Native mobile app for accessibility",
    ],
    stack: [
      "Next.js",
      "Node.js",
      "Express",
      "MongoDB",
      "React Native",
      "Tailwind CSS",
    ],
    contribution: [
      "College ERP experience across web and mobile",
      "Role-specific workflows and access control",
      "Attendance, feedback, and faculty modules",
    ],
    challenge:
      "College workflows serve multiple user roles and need to work across web and mobile.",
    solution:
      "The platform combines role-based access with dedicated modules and a React Native mobile application.",
    role: "Full stack development",
    year: "[TODO: year]",
    learned: "Building connected workflows for different institute roles across a web platform and mobile app.",
    live: "https://edumatrix.vercel.app",
    visual: "project-edu",
  },
  {
    slug: "swasthyasamriddhi",
    title: "SwasthyaSamriddhi: Healthcare Platform",
    shortTitle: "SwasthyaSamriddhi",
    category: ["Full Stack", "Web"],
    number: "02",
    description:
      "A centralized health record management platform with consent-based data sharing.",
    overview:
      "SwasthyaSamriddhi focuses on managing health information centrally while keeping data sharing consent-based.",
    features: [
      "Centralized health record management",
      "Consent-based health data sharing",
      "Comprehensive health data management",
    ],
    stack: ["Next.js", "MongoDB", "Tailwind CSS", "Redux", "Cloudinary"],
    contribution: [
      "Health record management platform",
      "Consent-based sharing experience",
      "Application interface and data workflows",
    ],
    challenge:
      "Health information needs to be organized while giving people control over sharing.",
    solution:
      "The platform brings records together and makes consent-based sharing a core workflow.",
    role: "Full stack development",
    year: "[TODO: year]",
    learned: "Designing health-record sharing around clear user consent.",
    live: "https://swasthya-samriddhi.vercel.app",
    visual: "project-health",
  },
  {
    slug: "dataflux-ai",
    title: "DataFlux AI Agent",
    shortTitle: "DataFlux AI",
    category: ["AI", "Full Stack"],
    number: "03",
    description:
      "An AI agent for database exploration, connecting a frontend and backend over streamable HTTP.",
    overview:
      "DataFlux uses natural-language understanding and dynamic tool invocation to make database exploration conversational.",
    features: [
      "Google Gemini integration for natural language understanding",
      "Dynamic tool invocation",
      "Streamable HTTP transport between frontend and backend",
      "Database exploration workflows",
    ],
    stack: [
      "Next.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "MCP Protocol",
      "Gemini API",
    ],
    contribution: [
      "AI-assisted database exploration",
      "Frontend and backend communication over streamable HTTP",
      "Gemini-powered tool invocation",
    ],
    challenge:
      "A database assistant needs to interpret natural language and communicate tool results across a frontend and backend.",
    solution:
      "The project combines Gemini with MCP tools and streamable HTTP transport.",
    role: "Full stack development",
    year: "[TODO: year]",
    learned: "Connecting natural-language requests to dynamically invoked tools over a transport layer.",
    github: "https://github.com/prathameshmane019/MCPAIAGENT",
    visual: "project-ai",
  },
  {
    slug: "suhani-travels",
    title: "Suhani Travels: Bus Ticket Booking Platform",
    shortTitle: "Suhani Travels",
    category: ["Full Stack", "Web"],
    number: "04",
    description:
      "A bus ticket booking platform with real-time seat selection and online payments.",
    overview:
      "Suhani Travels brings the core booking journey together, from checking seat availability to completing a payment.",
    features: [
      "Real-time seat selection and availability",
      "Secure online transactions through a payment gateway",
      "Bus ticket booking experience",
    ],
    stack: [
      "Next.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "Tailwind CSS",
      "Redux",
      "Shadcn UI",
    ],
    contribution: [
      "Bus ticket booking experience",
      "Seat selection and availability workflows",
      "Payment gateway integration",
    ],
    challenge:
      "Booking a bus ticket involves keeping seat availability visible through the selection and payment journey.",
    solution:
      "The platform combines seat selection, availability, and a payment gateway in one booking flow.",
    role: "Full stack development",
    year: "[TODO: year]",
    learned: "Bringing seat availability and payment into one booking journey.",
    live: "https://suhanitravels.vercel.app",
    visual: "project-travel",
  },
];
