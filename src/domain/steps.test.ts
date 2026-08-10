import { describe, expect, it } from 'vitest';
import { makeSteps } from '../test/factories';
import { addStep, moveStep, removeStep, renameStep, toggleStep } from './steps';

describe('opérations sur les étapes', () => {
  it('ajoute une étape non cochée à la fin', () => {
    const steps = addStep([], 'Première', 'a');
    expect(steps).toEqual([{ id: 'a', label: 'Première', done: false }]);
    expect(addStep(steps, 'Deuxième', 'b')[1]?.label).toBe('Deuxième');
  });

  it('supprime par identifiant et ignore un identifiant absent', () => {
    const steps = [
      { id: 'a', label: 'A', done: false },
      { id: 'b', label: 'B', done: false },
    ];
    expect(removeStep(steps, 'a')).toEqual([{ id: 'b', label: 'B', done: false }]);
    expect(removeStep(steps, 'inconnu')).toHaveLength(2);
  });

  it('inverse l’état d’une seule étape', () => {
    const steps = [
      { id: 'a', label: 'A', done: false },
      { id: 'b', label: 'B', done: true },
    ];
    expect(toggleStep(steps, 'a')).toEqual([
      { id: 'a', label: 'A', done: true },
      { id: 'b', label: 'B', done: true },
    ]);
  });

  it('renomme sans toucher à l’état coché', () => {
    const steps = [{ id: 'a', label: 'A', done: true }];
    expect(renameStep(steps, 'a', 'Nouveau')).toEqual([{ id: 'a', label: 'Nouveau', done: true }]);
  });

  it('déplace une étape d’un cran', () => {
    const steps = makeSteps([false, false, false]);
    const labels = (list: typeof steps) => list.map((step) => step.label);

    expect(labels(moveStep(steps, 0, 1))).toEqual([
      steps[1]!.label,
      steps[0]!.label,
      steps[2]!.label,
    ]);
    expect(labels(moveStep(steps, 2, -1))).toEqual([
      steps[0]!.label,
      steps[2]!.label,
      steps[1]!.label,
    ]);
  });

  it('laisse la liste inchangée aux extrémités et hors bornes', () => {
    const steps = makeSteps([false, false]);
    expect(moveStep(steps, 0, -1)).toBe(steps);
    expect(moveStep(steps, 1, 1)).toBe(steps);
    expect(moveStep(steps, 9, 1)).toBe(steps);
    expect(moveStep([], 0, 1)).toEqual([]);
  });

  it('ne mute jamais la liste reçue', () => {
    const steps = [{ id: 'a', label: 'A', done: false }];
    addStep(steps, 'B', 'b');
    toggleStep(steps, 'a');
    removeStep(steps, 'a');
    moveStep(steps, 0, 1);
    expect(steps).toEqual([{ id: 'a', label: 'A', done: false }]);
  });
});
