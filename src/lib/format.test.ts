import { describe, expect, it } from 'vitest';
import { formatDate, formatDaysLeft, formatPercent } from './format';

describe('formatDaysLeft', () => {
  it('n’affiche rien sans deadline', () => {
    expect(formatDaysLeft(null)).toBeNull();
  });

  it('nomme le jour même et le lendemain', () => {
    expect(formatDaysLeft(0)).toBe('Aujourd’hui');
    expect(formatDaysLeft(1)).toBe('Demain');
  });

  it('accorde le singulier et le pluriel du retard', () => {
    expect(formatDaysLeft(-1)).toBe('En retard d’1 jour');
    expect(formatDaysLeft(-12)).toBe('En retard de 12 jours');
  });

  it('annonce les échéances futures', () => {
    expect(formatDaysLeft(29)).toBe('Dans 29 jours');
  });
});

describe('formatDate', () => {
  it('passe en format français', () => {
    expect(formatDate('2025-10-12')).toBe('12/10/2025');
  });

  it('laisse passer une valeur inattendue sans planter', () => {
    expect(formatDate('bientôt')).toBe('bientôt');
  });
});

describe('formatPercent', () => {
  it('arrondit à l’entier', () => {
    expect(formatPercent(0)).toBe('0 %');
    expect(formatPercent(1)).toBe('100 %');
    expect(formatPercent(1 / 3)).toBe('33 %');
  });
});
