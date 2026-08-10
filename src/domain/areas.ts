import type { LifeAreaId } from './types';

export interface LifeArea {
  id: LifeAreaId;
  label: string;
  emoji: string;
}

/** Énumération figée des domaines de vie, dans leur ordre d'affichage. */
export const LIFE_AREAS: readonly LifeArea[] = [
  { id: 'health_fitness', label: 'Health & Fitness', emoji: '🧘‍♀️' },
  { id: 'career_growth', label: 'Career Growth', emoji: '💼' },
  { id: 'finances_wealth', label: 'Finances & Wealth', emoji: '💰' },
  { id: 'relationships', label: 'Relationships', emoji: '🤝' },
  { id: 'romance_love', label: 'Romance & Love', emoji: '❤️' },
  { id: 'spirituality', label: 'Spirituality Growth', emoji: '✨' },
  { id: 'home', label: 'Home', emoji: '🏡' },
  { id: 'adventure_travel', label: 'Adventure & Travel', emoji: '✈️' },
  { id: 'fun_hobbies', label: 'Fun & Hobbies', emoji: '🎨' },
  { id: 'community', label: 'Community', emoji: '🌍' },
];

const AREAS_BY_ID = new Map<string, LifeArea>(LIFE_AREAS.map((area) => [area.id, area]));

export function isLifeAreaId(value: unknown): value is LifeAreaId {
  return typeof value === 'string' && AREAS_BY_ID.has(value);
}

export function getArea(id: LifeAreaId): LifeArea {
  const area = AREAS_BY_ID.get(id);
  if (!area) {
    throw new Error(`Domaine de vie inconnu : ${id}`);
  }
  return area;
}

/** Libellé complet avec emoji, pour l'affichage. */
export function formatArea(id: LifeAreaId): string {
  const area = getArea(id);
  return `${area.emoji} ${area.label}`;
}
