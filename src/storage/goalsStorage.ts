import { toExportFile, validateGoalsPayload } from '../domain/serialization';
import type { Goal } from '../domain/types';

export const STORAGE_KEY = 'goal-planner:v1';

/**
 * Relit les objectifs stockés.
 *
 * Le contenu du localStorage passe par la même validation que l'import : une
 * entrée absente, tronquée ou corrompue rend une liste vide plutôt que de faire
 * planter l'app. La clé fautive n'est pas effacée, pour laisser une chance de
 * la récupérer à la main.
 */
export function loadGoals(): Goal[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];

  try {
    const result = validateGoalsPayload(JSON.parse(raw));
    if (!result.ok) {
      console.warn('Données locales invalides, elles sont ignorées :', result.errors);
      return [];
    }
    return result.goals;
  } catch {
    console.warn('Données locales illisibles, elles sont ignorées.');
    return [];
  }
}

export function saveGoals(goals: Goal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toExportFile(goals)));
  } catch (error) {
    // Quota dépassé ou stockage refusé (navigation privée) : l'app continue de
    // fonctionner en mémoire pour la session en cours.
    console.error('Échec de l’enregistrement local :', error);
  }
}

export function clearGoals(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Échec de la suppression des données locales :', error);
  }
}
