import type { Step } from "../engine/types";

export interface Workshop {
  examKey: string;
  title: string;
  verifiedSources: string[];
  sections: { id: string; title: string; targets: string[]; steps: Step[] }[];
}

const modules = import.meta.glob("./workshops/*.json", { eager: true }) as Record<string, { default: Workshop }>;
export const WORKSHOPS = Object.values(modules).map(module => module.default);

export function workshopSteps(workshop: Workshop): Step[] {
  return workshop.sections.flatMap((section, index) => section.steps.map(step => ({
    ...step,
    id: `workshop:${section.id}:${step.id}`,
    section: { id: section.id, title: section.title, index, total: workshop.sections.length, targets: section.targets }
  })));
}
