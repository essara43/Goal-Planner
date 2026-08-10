import type { Goal, GoalStatus, LifeAreaId } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Convertit une date seule `YYYY-MM-DD` en Date locale à minuit.
 * Renvoie `null` si la chaîne n'est pas une date calendaire réelle
 * (`2025-02-30` est rejetée, pas glissée au 2 mars).
 */
export function parseDateOnly(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;

  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Ramène un instant au minuit local du même jour. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Formate une date en `YYYY-MM-DD` selon le fuseau local. */
export function toDateOnly(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Ratio d'avancement entre 0 et 1. Vaut 0 lorsque l'objectif n'a aucune étape. */
export function progress(goal: Goal): number {
  if (goal.steps.length === 0) return 0;
  const done = goal.steps.filter((step) => step.done).length;
  return done / goal.steps.length;
}

/** Avancement en pourcentage entier, pour l'affichage. */
export function progressPercent(goal: Goal): number {
  return Math.round(progress(goal) * 100);
}

/**
 * Nombre de jours entiers avant la deadline.
 * `null` si l'objectif n'a pas de deadline (ou si elle est illisible),
 * négatif si elle est dépassée, `0` le jour même.
 */
export function daysLeft(goal: Goal, today: Date = new Date()): number | null {
  if (!goal.deadline) return null;
  const deadline = parseDateOnly(goal.deadline);
  if (!deadline) return null;
  // `round` plutôt que `floor` : les changements d'heure d'été décalent la
  // différence de ±1 h, ce qui fausserait une troncature.
  return Math.round((deadline.getTime() - startOfDay(today).getTime()) / MS_PER_DAY);
}

/** Un objectif atteint n'est jamais considéré en retard. */
export function isOverdue(goal: Goal, today: Date = new Date()): boolean {
  if (goal.status === 'achieved') return false;
  const left = daysLeft(goal, today);
  return left !== null && left < 0;
}

/**
 * Recale le statut après une modification des étapes.
 *
 * - toutes les étapes cochées (et au moins une étape) → `achieved` ;
 * - objectif `achieved` dont une étape est décochée → `in_progress`.
 *
 * Cette fonction n'est appelée qu'au moment où les étapes changent : un statut
 * choisi à la main reste donc intact tant que l'on ne touche pas aux étapes.
 */
export function applyStepRules(goal: Goal): Goal {
  if (goal.steps.length === 0) return goal;

  const allDone = goal.steps.every((step) => step.done);
  if (allDone && goal.status !== 'achieved') {
    return { ...goal, status: 'achieved' };
  }
  if (!allDone && goal.status === 'achieved') {
    return { ...goal, status: 'in_progress' };
  }
  return goal;
}

export interface GoalFilters {
  area: LifeAreaId | 'all';
  status: GoalStatus | 'all';
  query: string;
}

export const DEFAULT_FILTERS: GoalFilters = { area: 'all', status: 'all', query: '' };

/** Minuscules sans accents, pour une recherche tolérante. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function filterGoals(goals: Goal[], filters: GoalFilters): Goal[] {
  const query = normalize(filters.query.trim());
  return goals.filter((goal) => {
    if (filters.area !== 'all' && goal.area !== filters.area) return false;
    if (filters.status !== 'all' && goal.status !== filters.status) return false;
    if (query && !normalize(goal.title).includes(query)) return false;
    return true;
  });
}

export type SortKey = 'deadline' | 'progress';

/**
 * Tri stable, sans mutation du tableau d'entrée.
 *
 * - `deadline` : de la plus proche à la plus lointaine, objectifs sans deadline
 *   en dernier ;
 * - `progress` : du plus avancé au moins avancé.
 *
 * Les ex æquo sont départagés par le titre pour garder un ordre déterministe.
 */
export function sortGoals(goals: Goal[], key: SortKey): Goal[] {
  return [...goals].sort((a, b) => {
    if (key === 'deadline') {
      const left = a.deadline ?? null;
      const right = b.deadline ?? null;
      if (left === null && right !== null) return 1;
      if (left !== null && right === null) return -1;
      if (left !== null && right !== null && left !== right) {
        return left < right ? -1 : 1;
      }
    } else {
      const delta = progress(b) - progress(a);
      if (delta !== 0) return delta;
    }
    return a.title.localeCompare(b.title, 'fr');
  });
}
