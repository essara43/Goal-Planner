import type { Step } from './types';

/** Opérations pures sur une liste d'étapes ; aucune ne mute le tableau reçu. */

export function addStep(steps: Step[], label: string, id: string): Step[] {
  return [...steps, { id, label, done: false }];
}

export function removeStep(steps: Step[], id: string): Step[] {
  return steps.filter((step) => step.id !== id);
}

export function toggleStep(steps: Step[], id: string): Step[] {
  return steps.map((step) => (step.id === id ? { ...step, done: !step.done } : step));
}

export function renameStep(steps: Step[], id: string, label: string): Step[] {
  return steps.map((step) => (step.id === id ? { ...step, label } : step));
}

/**
 * Déplace une étape d'un cran. Une position hors bornes laisse la liste
 * inchangée, ce qui évite d'avoir à désactiver les boutons aux extrémités.
 */
export function moveStep(steps: Step[], index: number, direction: -1 | 1): Step[] {
  const target = index + direction;
  if (index < 0 || index >= steps.length || target < 0 || target >= steps.length) {
    return steps;
  }
  const next = [...steps];
  const moved = next[index]!;
  next[index] = next[target]!;
  next[target] = moved;
  return next;
}
