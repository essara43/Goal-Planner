import { applyStepRules } from './goals';
import type { Goal, GoalStatus, LifeAreaId, Step } from './types';

/** Contenu éditable d'un objectif, sans les champs techniques (id, horodatages). */
export interface GoalDraft {
  title: string;
  area: LifeAreaId;
  why: string;
  successCriteria: string;
  reward: string;
  deadline: string;
  status: GoalStatus;
  steps: Step[];
}

export function emptyDraft(): GoalDraft {
  return {
    title: '',
    area: 'health_fitness',
    why: '',
    successCriteria: '',
    reward: '',
    deadline: '',
    status: 'not_started',
    steps: [],
  };
}

export function toDraft(goal: Goal): GoalDraft {
  return {
    title: goal.title,
    area: goal.area,
    why: goal.why,
    successCriteria: goal.successCriteria,
    reward: goal.reward,
    deadline: goal.deadline ?? '',
    status: goal.status,
    steps: goal.steps.map((step) => ({ ...step })),
  };
}

function fromDraft(draft: GoalDraft) {
  const deadline = draft.deadline.trim();
  return {
    title: draft.title.trim(),
    area: draft.area,
    why: draft.why.trim(),
    successCriteria: draft.successCriteria.trim(),
    reward: draft.reward.trim(),
    ...(deadline ? { deadline } : {}),
    status: draft.status,
    steps: draft.steps.map((step) => ({ ...step, label: step.label.trim() })),
  };
}

/**
 * `id` et `now` sont injectés plutôt que générés ici, pour garder la fonction
 * pure et donc testable.
 */
export function createGoal(draft: GoalDraft, id: string, now: string): Goal {
  return applyStepRules({
    id,
    ...fromDraft(draft),
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Signature des cases cochées, insensible à l'ordre : réordonner des étapes
 * n'est pas un changement d'avancement.
 */
function doneSignature(steps: Step[]): string {
  return steps
    .map((step) => `${step.id}:${step.done ? 1 : 0}`)
    .sort()
    .join('|');
}

/** Réapplique le contenu d'un formulaire sur un objectif existant. */
export function updateGoal(goal: Goal, draft: GoalDraft, now: string): Goal {
  const next: Goal = {
    ...goal,
    ...fromDraft(draft),
    updatedAt: now,
  };
  // Le formulaire ne porte pas `deadline` lorsqu'elle est vidée : on la retire
  // explicitement pour ne pas conserver l'ancienne valeur héritée de `goal`.
  if (!draft.deadline.trim()) {
    delete next.deadline;
  }

  // Le recalcul automatique du statut ne se déclenche que si les cases cochées
  // ont bougé. Un statut choisi à la main survit donc à toute autre édition.
  if (doneSignature(goal.steps) !== doneSignature(next.steps)) {
    return applyStepRules(next);
  }
  return next;
}
