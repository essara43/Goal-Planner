import { describe, expect, it } from 'vitest';
import { makeGoal } from '../test/factories';
import { buildDashboard } from './dashboard';

const TODAY = new Date(2025, 5, 15); // 15 juin 2025

describe('buildDashboard — progression globale', () => {
  it('gère une liste vide sans division par zéro', () => {
    const dashboard = buildDashboard([], TODAY);
    expect(dashboard.overall).toEqual({ total: 0, achieved: 0, ratio: 0 });
    expect(dashboard.byArea).toEqual([]);
    expect(dashboard.upcoming).toEqual([]);
  });

  it('compte les objectifs atteints', () => {
    const dashboard = buildDashboard(
      [
        makeGoal({ status: 'achieved' }),
        makeGoal({ status: 'in_progress' }),
        makeGoal({ status: 'not_started' }),
        makeGoal({ status: 'achieved' }),
      ],
      TODAY,
    );
    expect(dashboard.overall).toEqual({ total: 4, achieved: 2, ratio: 0.5 });
  });

  it('vaut 1 quand tous les objectifs sont atteints', () => {
    const dashboard = buildDashboard([makeGoal({ status: 'achieved' })], TODAY);
    expect(dashboard.overall.ratio).toBe(1);
  });
});

describe('buildDashboard — tableau par domaine', () => {
  it('n’affiche que les domaines comptant au moins un objectif', () => {
    const dashboard = buildDashboard(
      [
        makeGoal({ area: 'career_growth', status: 'achieved' }),
        makeGoal({ area: 'career_growth', status: 'not_started' }),
        makeGoal({ area: 'home', status: 'not_started' }),
      ],
      TODAY,
    );

    expect(dashboard.byArea).toEqual([
      { areaId: 'career_growth', count: 2, achieved: 1, ratio: 0.5 },
      { areaId: 'home', count: 1, achieved: 0, ratio: 0 },
    ]);
  });

  it('conserve l’ordre de l’énumération des domaines', () => {
    const dashboard = buildDashboard(
      [makeGoal({ area: 'community' }), makeGoal({ area: 'health_fitness' })],
      TODAY,
    );
    expect(dashboard.byArea.map((row) => row.areaId)).toEqual(['health_fitness', 'community']);
  });
});

describe('buildDashboard — deadlines proches', () => {
  it('retient les deadlines à moins de 30 jours et exclut la frontière', () => {
    const dans29 = makeGoal({ title: 'Dans 29 jours', deadline: '2025-07-14' });
    const dans30 = makeGoal({ title: 'Dans 30 jours', deadline: '2025-07-15' });
    const dans31 = makeGoal({ title: 'Dans 31 jours', deadline: '2025-07-16' });

    const dashboard = buildDashboard([dans29, dans30, dans31], TODAY);
    expect(dashboard.upcoming.map((entry) => entry.goal.title)).toEqual(['Dans 29 jours']);
  });

  it('inclut le jour même et les retards, les plus en retard en tête', () => {
    const aujourdhui = makeGoal({ title: 'Aujourd’hui', deadline: '2025-06-15' });
    const enRetard = makeGoal({ title: 'En retard', deadline: '2025-06-10' });
    const tresEnRetard = makeGoal({ title: 'Très en retard', deadline: '2024-01-01' });

    const dashboard = buildDashboard([aujourdhui, enRetard, tresEnRetard], TODAY);
    expect(dashboard.upcoming.map((entry) => entry.goal.title)).toEqual([
      'Très en retard',
      'En retard',
      'Aujourd’hui',
    ]);
    expect(dashboard.upcoming.map((entry) => entry.daysLeft)).toEqual([-531, -5, 0]);
  });

  it('exclut les objectifs atteints et ceux sans deadline', () => {
    const dashboard = buildDashboard(
      [
        makeGoal({ title: 'Atteint', deadline: '2025-06-16', status: 'achieved' }),
        makeGoal({ title: 'Sans deadline' }),
        makeGoal({ title: 'Deadline illisible', deadline: 'bientôt' }),
      ],
      TODAY,
    );
    expect(dashboard.upcoming).toEqual([]);
  });
});
