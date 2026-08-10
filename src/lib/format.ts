import type { GoalStatus } from '../domain/types';

export const STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: 'Pas commencé',
  in_progress: 'En cours',
  achieved: 'Atteint',
};

/** Texte affiché dans le badge d'échéance. `null` s'il n'y a pas de deadline. */
export function formatDaysLeft(days: number | null): string | null {
  if (days === null) return null;
  if (days < 0) {
    const late = Math.abs(days);
    return late === 1 ? 'En retard d’1 jour' : `En retard de ${late} jours`;
  }
  if (days === 0) return 'Aujourd’hui';
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
}

/** Date seule `YYYY-MM-DD` rendue en français, sans décalage de fuseau. */
export function formatDate(dateOnly: string): string {
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return dateOnly;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`;
}
