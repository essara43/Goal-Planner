import { describe, expect, it } from 'vitest';
import { makeGoal, makeSteps } from '../test/factories';
import { createGoal, emptyDraft, toDraft, updateGoal } from './factory';

const NOW = '2025-06-15T09:00:00.000Z';

describe('createGoal', () => {
  it('nettoie les espaces et pose les horodatages', () => {
    const goal = createGoal(
      { ...emptyDraft(), title: '  Courir un semi  ', why: '  Tenir  ' },
      'g1',
      NOW,
    );
    expect(goal).toMatchObject({
      id: 'g1',
      title: 'Courir un semi',
      why: 'Tenir',
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it('omet une deadline vide plutôt que de stocker une chaîne vide', () => {
    const goal = createGoal({ ...emptyDraft(), title: 'Sans échéance' }, 'g1', NOW);
    expect(goal.deadline).toBeUndefined();
    expect('deadline' in goal).toBe(false);
  });

  it('marque atteint un objectif créé avec toutes ses étapes cochées', () => {
    const goal = createGoal(
      { ...emptyDraft(), title: 'Déjà fait', steps: makeSteps([true, true]) },
      'g1',
      NOW,
    );
    expect(goal.status).toBe('achieved');
  });
});

describe('updateGoal', () => {
  it('met à jour le contenu et l’horodatage sans changer id ni createdAt', () => {
    const goal = makeGoal({ title: 'Avant' });
    const updated = updateGoal(goal, { ...toDraft(goal), title: 'Après' }, NOW);
    expect(updated).toMatchObject({
      id: goal.id,
      title: 'Après',
      createdAt: goal.createdAt,
      updatedAt: NOW,
    });
  });

  it('retire la deadline quand le champ est vidé', () => {
    const goal = makeGoal({ deadline: '2025-09-01' });
    const updated = updateGoal(goal, { ...toDraft(goal), deadline: '' }, NOW);
    expect('deadline' in updated).toBe(false);
  });

  it('bascule en achieved quand la dernière case est cochée', () => {
    const goal = makeGoal({ status: 'in_progress', steps: makeSteps([true, false]) });
    const draft = toDraft(goal);
    draft.steps[1]!.done = true;
    expect(updateGoal(goal, draft, NOW).status).toBe('achieved');
  });

  it('repasse en in_progress quand une case est décochée', () => {
    const goal = makeGoal({ status: 'achieved', steps: makeSteps([true, true]) });
    const draft = toDraft(goal);
    draft.steps[0]!.done = false;
    expect(updateGoal(goal, draft, NOW).status).toBe('in_progress');
  });

  it('respecte un statut choisi à la main tant que les cases ne bougent pas', () => {
    const goal = makeGoal({ status: 'achieved', steps: makeSteps([true, true]) });
    const updated = updateGoal(goal, { ...toDraft(goal), status: 'in_progress' }, NOW);
    expect(updated.status).toBe('in_progress');
  });

  it('respecte un statut manuel lors d’un simple réordonnancement', () => {
    const goal = makeGoal({ status: 'in_progress', steps: makeSteps([true, true]) });
    const draft = toDraft(goal);
    draft.steps.reverse();
    expect(updateGoal(goal, draft, NOW).status).toBe('in_progress');
  });

  it('respecte un statut manuel sur un objectif sans étape', () => {
    const goal = makeGoal({ status: 'not_started', steps: [] });
    const updated = updateGoal(goal, { ...toDraft(goal), status: 'achieved' }, NOW);
    expect(updated.status).toBe('achieved');
  });
});

describe('toDraft', () => {
  it('copie les étapes en profondeur', () => {
    const goal = makeGoal({ steps: makeSteps([false]) });
    const draft = toDraft(goal);
    draft.steps[0]!.done = true;
    expect(goal.steps[0]!.done).toBe(false);
  });

  it('rend une deadline absente sous forme de chaîne vide, exploitable par un input date', () => {
    expect(toDraft(makeGoal()).deadline).toBe('');
  });
});
