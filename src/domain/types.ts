/**
 * Identifiants des domaines de vie.
 *
 * Ce sont des slugs stables et non les libellés affichés : renommer un libellé
 * dans `areas.ts` n'invalide donc pas les données déjà stockées ni les exports.
 */
export type LifeAreaId =
  | 'health_fitness'
  | 'career_growth'
  | 'finances_wealth'
  | 'relationships'
  | 'romance_love'
  | 'spirituality'
  | 'home'
  | 'adventure_travel'
  | 'fun_hobbies'
  | 'community';

export type GoalStatus = 'not_started' | 'in_progress' | 'achieved';

export interface Step {
  id: string;
  label: string;
  done: boolean;
}

export interface Goal {
  id: string;
  /** "What do you want to achieve?" */
  title: string;
  area: LifeAreaId;
  /** "Why is this goal important?" */
  why: string;
  /** "How do you measure success?" */
  successCriteria: string;
  reward: string;
  /** Date seule au format `YYYY-MM-DD`, pour éviter tout décalage de fuseau. */
  deadline?: string;
  status: GoalStatus;
  /** L'ordre du tableau est l'ordre d'affichage des étapes. */
  steps: Step[];
  /** Horodatage ISO complet. */
  createdAt: string;
  /** Horodatage ISO complet. */
  updatedAt: string;
}
