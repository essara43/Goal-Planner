import { LIFE_AREAS } from './areas';
import { daysLeft } from './goals';
import type { Goal, LifeAreaId } from './types';

/** Fenêtre « deadline proche » du tableau de bord, en jours. */
export const UPCOMING_WINDOW_DAYS = 30;

export interface OverallProgress {
  total: number;
  achieved: number;
  /** Ratio entre 0 et 1. Vaut 0 lorsqu'il n'y a aucun objectif. */
  ratio: number;
}

export interface AreaSummary {
  areaId: LifeAreaId;
  count: number;
  achieved: number;
  ratio: number;
}

export interface UpcomingGoal {
  goal: Goal;
  daysLeft: number;
}

export interface Dashboard {
  overall: OverallProgress;
  /** Uniquement les domaines comptant au moins un objectif, dans l'ordre de `LIFE_AREAS`. */
  byArea: AreaSummary[];
  /** Deadlines dans moins de 30 jours, retards inclus et affichés en premier. */
  upcoming: UpcomingGoal[];
}

export function buildDashboard(goals: Goal[], today: Date = new Date()): Dashboard {
  const achieved = goals.filter((goal) => goal.status === 'achieved').length;

  const byArea: AreaSummary[] = [];
  for (const area of LIFE_AREAS) {
    const areaGoals = goals.filter((goal) => goal.area === area.id);
    if (areaGoals.length === 0) continue;
    const areaAchieved = areaGoals.filter((goal) => goal.status === 'achieved').length;
    byArea.push({
      areaId: area.id,
      count: areaGoals.length,
      achieved: areaAchieved,
      ratio: areaAchieved / areaGoals.length,
    });
  }

  const upcoming: UpcomingGoal[] = [];
  for (const goal of goals) {
    if (goal.status === 'achieved') continue;
    const left = daysLeft(goal, today);
    if (left === null || left >= UPCOMING_WINDOW_DAYS) continue;
    upcoming.push({ goal, daysLeft: left });
  }
  upcoming.sort((a, b) => a.daysLeft - b.daysLeft || a.goal.title.localeCompare(b.goal.title, 'fr'));

  return {
    overall: {
      total: goals.length,
      achieved,
      ratio: goals.length === 0 ? 0 : achieved / goals.length,
    },
    byArea,
    upcoming,
  };
}
