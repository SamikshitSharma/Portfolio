import type { ProjectSlug } from "./projects";

export const profiles = [
  { name: "LinkedIn", detail: "Start a conversation", url: "https://in.linkedin.com/in/samikshit-sharma-751977297" },
  { name: "GitHub", detail: "Explore my repositories", url: "https://github.com/SamikshitSharma" },
] as const;

export const chapters = [
  { id: "intro", label: "Introduction" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "achievements", label: "Achievements" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

export const skills = [
  { name: "Languages", tools: ["Python", "TypeScript", "JavaScript", "SQL"] },
  { name: "Frontend", tools: ["React", "Next.js", "Astro", "HTML", "CSS"] },
  { name: "Backend & data", tools: ["FastAPI", "SQLAlchemy", "ChromaDB", "REST APIs"] },
  { name: "Applied AI", tools: ["Retrieval-augmented generation", "Gemini", "Groq", "Structured output"] },
  { name: "Cloud & infrastructure", tools: ["Azure", "Docker", "Terraform", "Bicep", "Kubernetes", "Ansible", "Linux"] },
  { name: "Delivery & testing", tools: ["Git", "GitHub Actions", "Jenkins", "Pytest", "Vitest", "Playwright", "Schema validation"] },
];

interface Credential {
  title: string;
  issuer: string;
  date: string;
  type: string;
  id?: string;
  context?: string;
}

export const credentials: readonly Credential[] = [
  { title: "Oracle Cloud Infrastructure 2025 Certified Foundations Associate", issuer: "Oracle", date: "May 2026", type: "Certification" },
  { title: "Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate", issuer: "Oracle", date: "May 2026", type: "Certification" },
  { title: "Cisco Network Management Systems", issuer: "Cisco Networking Academy", date: "February 2026", type: "Course completion" },
  { title: "Continuous Integration and Delivery - DevOps", issuer: "Infosys Springboard", date: "October 2025", type: "Course completion" },
  {
    title: "Professional Certification Program in Computer Science Engineering with Specialization in Cloud Computing",
    issuer: "Conducted by iHUB DivyaSampark at Indian Institute of Technology Roorkee, in association with Intellipaat.",
    date: "30 October 2026",
    type: "Certificate of Completion",
    id: "IPTIH2610159",
    context: "The certificate identifies iHUB DivyaSampark as a joint initiative of the Department of Science & Technology, Government of India, and IIT Roorkee.",
  },
];

export const evaluationCriteria = ["Code Quality", "Security", "Efficiency", "Testing", "Accessibility", "Problem Statement Alignment"] as const;

interface Achievement {
  project: ProjectSlug;
  challenge: string;
  round?: string;
  rank: string;
  score: string;
  breakdown: readonly [number, number, number, number, number, number];
}

export const achievements: readonly Achievement[] = [
  {
    project: "legal-consistency",
    challenge: "AI for Legal Assistance & Access",
    rank: "#92 / 1,004",
    score: "97.5",
    breakdown: [100, 100, 90, 90, 100, 100],
  },
  {
    project: "utsavpilot",
    challenge: "Celebration & Event Planner",
    round: "Challenge 5",
    rank: "#693 / 52,136",
    score: "93.81",
    breakdown: [86, 98, 80, 99, 96, 100],
  },
  {
    project: "stadium-ops",
    challenge: "Smart Stadiums & Tournament Operations",
    round: "Challenge 4",
    rank: "#530 / 1,713",
    score: "91.28",
    breakdown: [86, 98, 80, 98, 96, 93],
  },
];
