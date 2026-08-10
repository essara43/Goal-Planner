import { isLifeAreaId } from './areas';
import { parseDateOnly } from './goals';
import type { Goal, GoalStatus, Step } from './types';

export const SCHEMA_VERSION = 1;

export interface GoalsFile {
  version: number;
  goals: Goal[];
}

export type ParseResult =
  | { ok: true; goals: Goal[] }
  | { ok: false; errors: string[] };

const STATUSES: readonly GoalStatus[] = ['not_started', 'in_progress', 'achieved'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Champ texte optionnel : absent ou `null` vaut chaîne vide, mais un type
 * inattendu (nombre, objet…) est signalé plutôt que converti en silence.
 */
function readOptionalText(
  source: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): string {
  const value = source[key];
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    errors.push(`${path}.${key} : texte attendu.`);
    return '';
  }
  return value;
}

function readTimestamp(
  source: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = source[key];
  if (typeof value !== 'string') return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : value;
}

function validateSteps(value: unknown, path: string, errors: string[]): Step[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors.push(`${path}.steps : tableau attendu.`);
    return [];
  }

  const steps: Step[] = [];
  const seen = new Set<string>();

  value.forEach((raw, index) => {
    const stepPath = `${path}.steps[${index}]`;
    if (!isRecord(raw)) {
      errors.push(`${stepPath} : objet attendu.`);
      return;
    }
    if (typeof raw.id !== 'string' || raw.id.trim() === '') {
      errors.push(`${stepPath}.id : identifiant manquant.`);
      return;
    }
    if (seen.has(raw.id)) {
      errors.push(`${stepPath}.id : identifiant en double (${raw.id}).`);
      return;
    }
    if (typeof raw.label !== 'string') {
      errors.push(`${stepPath}.label : texte attendu.`);
      return;
    }
    if (typeof raw.done !== 'boolean') {
      errors.push(`${stepPath}.done : booléen attendu.`);
      return;
    }
    seen.add(raw.id);
    steps.push({ id: raw.id, label: raw.label, done: raw.done });
  });

  return steps;
}

function validateGoal(raw: unknown, path: string, errors: string[]): Goal | null {
  if (!isRecord(raw)) {
    errors.push(`${path} : objet attendu.`);
    return null;
  }

  const before = errors.length;

  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    errors.push(`${path}.id : identifiant manquant.`);
  }
  if (typeof raw.title !== 'string' || raw.title.trim() === '') {
    errors.push(`${path}.title : titre manquant.`);
  }
  if (!isLifeAreaId(raw.area)) {
    errors.push(`${path}.area : domaine de vie inconnu (${String(raw.area)}).`);
  }

  const status = raw.status === undefined || raw.status === null ? 'not_started' : raw.status;
  if (!STATUSES.includes(status as GoalStatus)) {
    errors.push(`${path}.status : statut inconnu (${String(raw.status)}).`);
  }

  let deadline: string | undefined;
  if (raw.deadline !== undefined && raw.deadline !== null && raw.deadline !== '') {
    if (typeof raw.deadline !== 'string' || !parseDateOnly(raw.deadline)) {
      errors.push(`${path}.deadline : date AAAA-MM-JJ attendue (${String(raw.deadline)}).`);
    } else {
      deadline = raw.deadline;
    }
  }

  const why = readOptionalText(raw, 'why', path, errors);
  const successCriteria = readOptionalText(raw, 'successCriteria', path, errors);
  const reward = readOptionalText(raw, 'reward', path, errors);
  const steps = validateSteps(raw.steps, path, errors);

  if (errors.length > before) return null;

  const createdAt = readTimestamp(raw, 'createdAt', new Date().toISOString());
  return {
    id: raw.id as string,
    title: raw.title as string,
    area: raw.area as Goal['area'],
    why,
    successCriteria,
    reward,
    ...(deadline ? { deadline } : {}),
    status: status as GoalStatus,
    steps,
    createdAt,
    updatedAt: readTimestamp(raw, 'updatedAt', createdAt),
  };
}

/**
 * Valide une structure déjà désérialisée.
 *
 * Ne lève jamais : toute anomalie est rendue sous forme de messages destinés à
 * l'utilisateur. L'import est tout ou rien — un seul objectif invalide fait
 * échouer le fichier entier, pour ne pas remplacer les données par un jeu
 * partiel sans que ce soit visible.
 */
export function validateGoalsPayload(payload: unknown): ParseResult {
  const errors: string[] = [];

  if (!isRecord(payload)) {
    return { ok: false, errors: ['Le fichier doit contenir un objet JSON.'] };
  }
  if (payload.version !== undefined && payload.version !== SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [
        `Version de schéma non prise en charge : ${String(payload.version)} (attendu ${SCHEMA_VERSION}).`,
      ],
    };
  }
  if (!Array.isArray(payload.goals)) {
    return { ok: false, errors: ['Le champ « goals » est absent ou n’est pas un tableau.'] };
  }

  const goals: Goal[] = [];
  const seen = new Set<string>();

  payload.goals.forEach((raw, index) => {
    const goal = validateGoal(raw, `goals[${index}]`, errors);
    if (!goal) return;
    if (seen.has(goal.id)) {
      errors.push(`goals[${index}].id : identifiant en double (${goal.id}).`);
      return;
    }
    seen.add(goal.id);
    goals.push(goal);
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, goals };
}

/** Désérialise puis valide le contenu brut d'un fichier importé. */
export function parseGoalsFile(raw: string): ParseResult {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ["Le fichier n'est pas du JSON valide."] };
  }
  return validateGoalsPayload(payload);
}

export function toExportFile(goals: Goal[]): GoalsFile {
  return { version: SCHEMA_VERSION, goals };
}

export function serializeGoals(goals: Goal[]): string {
  return `${JSON.stringify(toExportFile(goals), null, 2)}\n`;
}
