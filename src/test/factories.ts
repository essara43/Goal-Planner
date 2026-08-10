import type { Goal, Step } from '../domain/types';

let counter = 0;

export function makeStep(overrides: Partial<Step> = {}): Step {
  counter += 1;
  return { id: `step-${counter}`, label: `Étape ${counter}`, done: false, ...overrides };
}

export function makeSteps(doneFlags: boolean[]): Step[] {
  return doneFlags.map((done) => makeStep({ done }));
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  counter += 1;
  return {
    id: `goal-${counter}`,
    title: `Objectif ${counter}`,
    area: 'health_fitness',
    why: '',
    successCriteria: '',
    reward: '',
    status: 'not_started',
    steps: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}
