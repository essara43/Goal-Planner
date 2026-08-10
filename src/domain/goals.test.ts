import { describe, expect, it } from 'vitest';
import { makeGoal, makeSteps } from '../test/factories';
import {
  applyStepRules,
  daysLeft,
  filterGoals,
  isOverdue,
  parseDateOnly,
  progress,
  progressPercent,
  sortGoals,
  toDateOnly,
} from './goals';

const TODAY = new Date(2025, 5, 15); // 15 juin 2025, heure locale

describe('progress', () => {
  it('vaut 0 quand l’objectif n’a aucune étape', () => {
    expect(progress(makeGoal({ steps: [] }))).toBe(0);
    expect(progressPercent(makeGoal({ steps: [] }))).toBe(0);
  });

  it('vaut 0 quand aucune étape n’est cochée', () => {
    expect(progress(makeGoal({ steps: makeSteps([false, false, false]) }))).toBe(0);
  });

  it('rapporte les étapes cochées au total', () => {
    const goal = makeGoal({ steps: makeSteps([true, true, false, false, false]) });
    expect(progress(goal)).toBeCloseTo(0.4);
    expect(progressPercent(goal)).toBe(40);
  });

  it('vaut 1 quand toutes les étapes sont cochées', () => {
    expect(progress(makeGoal({ steps: makeSteps([true, true]) }))).toBe(1);
    expect(progressPercent(makeGoal({ steps: makeSteps([true, true]) }))).toBe(100);
  });

  it('arrondit le pourcentage à l’entier', () => {
    expect(progressPercent(makeGoal({ steps: makeSteps([true, false, false]) }))).toBe(33);
  });
});

describe('parseDateOnly', () => {
  it('lit une date valide comme minuit local', () => {
    const date = parseDateOnly('2025-06-15');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2025);
    expect(date?.getMonth()).toBe(5);
    expect(date?.getDate()).toBe(15);
    expect(date?.getHours()).toBe(0);
  });

  it('rejette les formats et dates impossibles', () => {
    expect(parseDateOnly('')).toBeNull();
    expect(parseDateOnly('15/06/2025')).toBeNull();
    expect(parseDateOnly('2025-6-15')).toBeNull();
    expect(parseDateOnly('2025-13-01')).toBeNull();
    expect(parseDateOnly('2025-02-30')).toBeNull();
    expect(parseDateOnly('pas une date')).toBeNull();
  });

  it('fait l’aller-retour avec toDateOnly', () => {
    expect(toDateOnly(new Date(2025, 0, 5))).toBe('2025-01-05');
    expect(toDateOnly(parseDateOnly('2024-02-29')!)).toBe('2024-02-29');
  });
});

describe('daysLeft', () => {
  it('renvoie null sans deadline', () => {
    expect(daysLeft(makeGoal(), TODAY)).toBeNull();
  });

  it('renvoie null si la deadline stockée est illisible', () => {
    expect(daysLeft(makeGoal({ deadline: 'hier' }), TODAY)).toBeNull();
  });

  it('vaut 0 le jour même', () => {
    expect(daysLeft(makeGoal({ deadline: '2025-06-15' }), TODAY)).toBe(0);
  });

  it('est positif pour une deadline future', () => {
    expect(daysLeft(makeGoal({ deadline: '2025-06-16' }), TODAY)).toBe(1);
    expect(daysLeft(makeGoal({ deadline: '2025-07-15' }), TODAY)).toBe(30);
  });

  it('est négatif pour une deadline dépassée', () => {
    expect(daysLeft(makeGoal({ deadline: '2025-06-14' }), TODAY)).toBe(-1);
    expect(daysLeft(makeGoal({ deadline: '2024-06-15' }), TODAY)).toBe(-365);
  });

  it('ignore l’heure du moment de référence', () => {
    const lateEvening = new Date(2025, 5, 15, 23, 59, 59);
    expect(daysLeft(makeGoal({ deadline: '2025-06-16' }), lateEvening)).toBe(1);
  });

  it('traverse correctement un changement d’heure d’été', () => {
    // Passage à l'heure d'été en Europe le 30 mars 2025.
    const before = new Date(2025, 2, 28);
    expect(daysLeft(makeGoal({ deadline: '2025-04-02' }), before)).toBe(5);
  });
});

describe('isOverdue', () => {
  it('signale une deadline dépassée', () => {
    expect(isOverdue(makeGoal({ deadline: '2025-06-01' }), TODAY)).toBe(true);
  });

  it('ne signale ni le jour même ni le futur', () => {
    expect(isOverdue(makeGoal({ deadline: '2025-06-15' }), TODAY)).toBe(false);
    expect(isOverdue(makeGoal({ deadline: '2025-06-16' }), TODAY)).toBe(false);
  });

  it('ne signale jamais un objectif atteint ni un objectif sans deadline', () => {
    expect(isOverdue(makeGoal({ deadline: '2025-01-01', status: 'achieved' }), TODAY)).toBe(false);
    expect(isOverdue(makeGoal(), TODAY)).toBe(false);
  });
});

describe('applyStepRules', () => {
  it('bascule en achieved quand toutes les étapes sont cochées', () => {
    const goal = makeGoal({ status: 'in_progress', steps: makeSteps([true, true]) });
    expect(applyStepRules(goal).status).toBe('achieved');
  });

  it('repasse en in_progress quand une étape est décochée', () => {
    const goal = makeGoal({ status: 'achieved', steps: makeSteps([true, false]) });
    expect(applyStepRules(goal).status).toBe('in_progress');
  });

  it('laisse intact un objectif sans étape, y compris marqué atteint à la main', () => {
    const manual = makeGoal({ status: 'achieved', steps: [] });
    expect(applyStepRules(manual)).toBe(manual);
    const untouched = makeGoal({ status: 'not_started', steps: [] });
    expect(applyStepRules(untouched)).toBe(untouched);
  });

  it('laisse intact un statut cohérent avec les étapes', () => {
    const goal = makeGoal({ status: 'not_started', steps: makeSteps([false, false]) });
    expect(applyStepRules(goal)).toBe(goal);
  });

  it('ne mute pas l’objectif reçu', () => {
    const goal = makeGoal({ status: 'in_progress', steps: makeSteps([true]) });
    applyStepRules(goal);
    expect(goal.status).toBe('in_progress');
  });
});

describe('filterGoals', () => {
  const goals = [
    makeGoal({ title: 'Courir un semi', area: 'health_fitness', status: 'in_progress' }),
    makeGoal({ title: 'Épargne de précaution', area: 'finances_wealth', status: 'achieved' }),
    makeGoal({ title: 'Apprendre la poterie', area: 'fun_hobbies', status: 'not_started' }),
  ];

  it('ne filtre rien par défaut', () => {
    expect(filterGoals(goals, { area: 'all', status: 'all', query: '' })).toHaveLength(3);
  });

  it('filtre par domaine et par statut', () => {
    expect(filterGoals(goals, { area: 'finances_wealth', status: 'all', query: '' })).toHaveLength(1);
    expect(filterGoals(goals, { area: 'all', status: 'achieved', query: '' })).toHaveLength(1);
    expect(
      filterGoals(goals, { area: 'health_fitness', status: 'achieved', query: '' }),
    ).toHaveLength(0);
  });

  it('cherche dans le titre sans tenir compte de la casse ni des accents', () => {
    expect(filterGoals(goals, { area: 'all', status: 'all', query: 'SEMI' })).toHaveLength(1);
    expect(filterGoals(goals, { area: 'all', status: 'all', query: 'epargne' })).toHaveLength(1);
    expect(filterGoals(goals, { area: 'all', status: 'all', query: '  poterie  ' })).toHaveLength(1);
    expect(filterGoals(goals, { area: 'all', status: 'all', query: 'introuvable' })).toHaveLength(0);
  });
});

describe('sortGoals', () => {
  it('classe les deadlines de la plus proche à la plus lointaine, sans deadline en dernier', () => {
    const sansDeadline = makeGoal({ title: 'Sans deadline' });
    const juillet = makeGoal({ title: 'Juillet', deadline: '2025-07-01' });
    const juin = makeGoal({ title: 'Juin', deadline: '2025-06-01' });

    const sorted = sortGoals([sansDeadline, juillet, juin], 'deadline');
    expect(sorted.map((goal) => goal.title)).toEqual(['Juin', 'Juillet', 'Sans deadline']);
  });

  it('classe du plus avancé au moins avancé', () => {
    const vide = makeGoal({ title: 'Vide', steps: [] });
    const complet = makeGoal({ title: 'Complet', steps: makeSteps([true, true]) });
    const moitie = makeGoal({ title: 'Moitié', steps: makeSteps([true, false]) });

    const sorted = sortGoals([vide, complet, moitie], 'progress');
    expect(sorted.map((goal) => goal.title)).toEqual(['Complet', 'Moitié', 'Vide']);
  });

  it('départage les ex æquo par titre', () => {
    const b = makeGoal({ title: 'Bravo', deadline: '2025-06-01' });
    const a = makeGoal({ title: 'Alpha', deadline: '2025-06-01' });
    expect(sortGoals([b, a], 'deadline').map((goal) => goal.title)).toEqual(['Alpha', 'Bravo']);
  });

  it('ne mute pas le tableau reçu', () => {
    const input = [
      makeGoal({ title: 'Zoulou', deadline: '2025-12-01' }),
      makeGoal({ title: 'Alpha', deadline: '2025-01-01' }),
    ];
    sortGoals(input, 'deadline');
    expect(input.map((goal) => goal.title)).toEqual(['Zoulou', 'Alpha']);
  });

  it('accepte une liste vide', () => {
    expect(sortGoals([], 'deadline')).toEqual([]);
    expect(sortGoals([], 'progress')).toEqual([]);
  });
});
