import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGoal } from '../test/factories';
import { STORAGE_KEY, clearGoals, loadGoals, saveGoals } from './goalsStorage';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('goalsStorage', () => {
  it('renvoie une liste vide au premier lancement', () => {
    expect(loadGoals()).toEqual([]);
  });

  it('fait l’aller-retour enregistrement / relecture', () => {
    const goals = [makeGoal({ title: 'Courir un semi', deadline: '2025-10-12' })];
    saveGoals(goals);
    expect(loadGoals()).toEqual(goals);
  });

  it('ignore un contenu qui n’est pas du JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'ceci nest pas du json');
    expect(loadGoals()).toEqual([]);
  });

  it('ignore un contenu JSON au mauvais schéma', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ goals: [{ id: 'g1' }] }));
    expect(loadGoals()).toEqual([]);
  });

  it('conserve la clé corrompue au lieu de l’effacer', () => {
    localStorage.setItem(STORAGE_KEY, '{{');
    loadGoals();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{{');
  });

  it('efface les données sur demande', () => {
    saveGoals([makeGoal()]);
    clearGoals();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadGoals()).toEqual([]);
  });
});
