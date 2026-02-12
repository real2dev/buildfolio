export type Answers = Record<string, string>;

export type Question = {
  id: string;
  text: string;
  placeholder: string;
  suggestions: string[];
  branch?: (answer: string, answers: Answers) => string | null;
  validate?: (answer: string) => boolean;
};

export const QUESTIONS: Question[] = [
  {
    id: "role",
    text: "What best describes you?",
    placeholder: "Type anything...",
    suggestions: [
      "Software Engineer",
      "Student",
      "Designer",
      "Founder",
      "Freelancer",
      "Creator",
      "Product Manager",
      "Data Analyst",
      "Marketer",
      "Photographer",
      "Writer",
      "Other",
    ],
  },
  {
    id: "name",
    text: "What is your full name?",
    placeholder: "e.g. Jordan Lee",
    suggestions: [],
  },
  {
    id: "headline",
    text: "Write a one-line headline",
    placeholder: "e.g. Product designer focused on fintech",
    suggestions: [
      "Product designer focused on fintech",
      "Full-stack engineer building modern web apps",
      "Founder shipping AI tools for creators",
    ],
  },
  {
    id: "location",
    text: "Where are you based?",
    placeholder: "City, Country",
    suggestions: [
      "San Francisco, USA",
      "New York, USA",
      "London, UK",
      "Berlin, Germany",
      "Toronto, Canada",
    ],
  },
  {
    id: "website",
    text: "Do you have a personal website?",
    placeholder: "Optional link",
    suggestions: ["https://", "https://yourname.com"],
  },
  {
    id: "project",
    text: "Share your top project",
    placeholder: "Project name",
    suggestions: ["Atlas", "Rift", "Northstar", "Studio"],
  },
  {
    id: "stack",
    text: "What tools do you use most?",
    placeholder: "e.g. React, Figma, Notion",
    suggestions: ["React, TypeScript, Next.js", "Figma, Framer, Notion"],
  },
  {
    id: "goal",
    text: "What is your main goal for this portfolio?",
    placeholder: "e.g. Get hired, find clients",
    suggestions: ["Get hired", "Find clients", "Showcase work", "Raise funding"],
  },
];
