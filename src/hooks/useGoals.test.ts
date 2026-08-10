import { describe, expect, it } from 'vitest';
import { emptyDraft, toDraft } from '../domain/factory';
import { makeGoal, makeSteps } from '../test/factories';
import { goalsReducer } from './useGoals';

const NOW = '2025-06-15T09:00:00.000Z';

describe('goalsReducer', () => {
  it('ajoute un objectif à la fin', () => {
    const state = goalsReducer([], {
      type: 'create',
      draft: { ...emptyDraft(), title: 'Premier' },
      id: 'g1',
      now: NOW,
    });
    expect(state.map((goal) => goal.title)).toEqual(['Premier']);
  });

  it('ne modifie que l’objectif ciblé', () => {
    const a = makeGoal({ id: 'a', title: 'A' });
    const b = makeGoal({ id: 'b', title: 'B' });
    const state = goalsReducer([a, b], {
      type: 'update',
      id: 'b',
      draft: { ...toDraft(b), title: 'B modifié' },
      now: NOW,
    });
    expect(state[0]).toBe(a);
    expect(state[1]?.title).toBe('B modifié');
  });

  it('ignore la mise à jour d’un identifiant inconnu', () => {
    const a = makeGoal({ id: 'a' });
    const state = goalsReducer([a], {
      type: 'update',
      id: 'inconnu',
      draft: emptyDraft(),
      now: NOW,
    });
    expect(state).toEqual([a]);
  });

  it('applique la règle de statut à la mise à jour', () => {
    const goal = makeGoal({ id: 'a', status: 'in_progress', steps: makeSteps([true, false]) });
    const draft = toDraft(goal);
    draft.steps[1]!.done = true;
    const state = goalsReducer([goal], { type: 'update', id: 'a', draft, now: NOW });
    expect(state[0]?.status).toBe('achieved');
  });

  it('supprime par identifiant', () => {
    const a = makeGoal({ id: 'a' });
    const b = makeGoal({ id: 'b' });
    expect(goalsReducer([a, b], { type: 'delete', id: 'a' })).toEqual([b]);
  });

  it('remplace l’intégralité des données', () => {
    const imported = [makeGoal({ id: 'x' })];
    expect(goalsReducer([makeGoal()], { type: 'replaceAll', goals: imported })).toBe(imported);
  });

  it('ne mute pas l’état précédent', () => {
    const state = [makeGoal({ id: 'a' })];
    goalsReducer(state, { type: 'delete', id: 'a' });
    goalsReducer(state, { type: 'create', draft: emptyDraft(), id: 'g2', now: NOW });
    expect(state).toHaveLength(1);
  });
});
