import { describe, expect, it } from 'vitest';
import { makeGoal } from '../test/factories';
import {
  SCHEMA_VERSION,
  parseGoalsFile,
  serializeGoals,
  toExportFile,
  validateGoalsPayload,
} from './serialization';

function expectErrors(result: ReturnType<typeof validateGoalsPayload>): string[] {
  expect(result.ok).toBe(false);
  return result.ok ? [] : result.errors;
}

const validGoal = {
  id: 'g1',
  title: 'Courir un semi',
  area: 'health_fitness',
  why: 'Tenir la distance',
  successCriteria: 'Franchir la ligne',
  reward: 'Un massage',
  deadline: '2025-10-12',
  status: 'in_progress',
  steps: [
    { id: 's1', label: 'Plan d’entraînement', done: true },
    { id: 's2', label: '10 km sans marcher', done: false },
  ],
  createdAt: '2025-01-01T10:00:00.000Z',
  updatedAt: '2025-02-01T10:00:00.000Z',
};

describe('export', () => {
  it('enveloppe les objectifs avec la version du schéma', () => {
    expect(toExportFile([])).toEqual({ version: SCHEMA_VERSION, goals: [] });
  });

  it('produit un JSON relisible par l’import', () => {
    const goals = [makeGoal({ title: 'Aller-retour', deadline: '2025-09-01' })];
    const result = parseGoalsFile(serializeGoals(goals));
    expect(result).toEqual({ ok: true, goals });
  });
});

describe('import — fichier inexploitable', () => {
  it('rejette un JSON invalide sans lever d’exception', () => {
    const errors = expectErrors(parseGoalsFile('{ ceci n’est pas du json'));
    expect(errors[0]).toMatch(/JSON valide/);
  });

  it('rejette une racine qui n’est pas un objet', () => {
    expect(expectErrors(parseGoalsFile('[]'))).toHaveLength(1);
    expect(expectErrors(parseGoalsFile('"texte"'))).toHaveLength(1);
    expect(expectErrors(parseGoalsFile('null'))).toHaveLength(1);
    expect(expectErrors(parseGoalsFile('42'))).toHaveLength(1);
  });

  it('rejette un champ goals absent ou mal typé', () => {
    expect(expectErrors(validateGoalsPayload({}))[0]).toMatch(/goals/);
    expect(expectErrors(validateGoalsPayload({ goals: {} }))[0]).toMatch(/goals/);
    expect(expectErrors(validateGoalsPayload({ goals: 'rien' }))[0]).toMatch(/goals/);
  });

  it('rejette une version de schéma inconnue', () => {
    const errors = expectErrors(validateGoalsPayload({ version: 2, goals: [] }));
    expect(errors[0]).toMatch(/Version de schéma/);
  });

  it('accepte un fichier sans champ version', () => {
    expect(validateGoalsPayload({ goals: [] })).toEqual({ ok: true, goals: [] });
  });
});

describe('import — objectifs invalides', () => {
  it('accepte un objectif complet', () => {
    const result = validateGoalsPayload({ version: 1, goals: [validGoal] });
    expect(result.ok).toBe(true);
    expect(result.ok && result.goals[0]?.title).toBe('Courir un semi');
  });

  it('signale un objectif qui n’est pas un objet', () => {
    expect(expectErrors(validateGoalsPayload({ goals: ['texte'] }))[0]).toMatch(/objet attendu/);
  });

  it('signale un identifiant ou un titre manquant', () => {
    const errors = expectErrors(
      validateGoalsPayload({ goals: [{ ...validGoal, id: '', title: '   ' }] }),
    );
    expect(errors).toEqual([
      expect.stringMatching(/id/),
      expect.stringMatching(/title/),
    ]);
  });

  it('signale un domaine de vie inconnu', () => {
    const errors = expectErrors(
      validateGoalsPayload({ goals: [{ ...validGoal, area: 'gardening' }] }),
    );
    expect(errors[0]).toMatch(/domaine de vie inconnu/);
  });

  it('signale un statut inconnu', () => {
    const errors = expectErrors(
      validateGoalsPayload({ goals: [{ ...validGoal, status: 'done' }] }),
    );
    expect(errors[0]).toMatch(/statut inconnu/);
  });

  it('signale une deadline illisible', () => {
    expect(
      expectErrors(validateGoalsPayload({ goals: [{ ...validGoal, deadline: '12/10/2025' }] }))[0],
    ).toMatch(/deadline/);
    expect(
      expectErrors(validateGoalsPayload({ goals: [{ ...validGoal, deadline: '2025-02-30' }] }))[0],
    ).toMatch(/deadline/);
  });

  it('signale des étapes mal formées', () => {
    expect(
      expectErrors(validateGoalsPayload({ goals: [{ ...validGoal, steps: 'aucune' }] }))[0],
    ).toMatch(/tableau attendu/);
    expect(
      expectErrors(
        validateGoalsPayload({ goals: [{ ...validGoal, steps: [{ id: 's1', label: 'A' }] }] }),
      )[0],
    ).toMatch(/done/);
    expect(
      expectErrors(
        validateGoalsPayload({ goals: [{ ...validGoal, steps: [{ label: 'A', done: false }] }] }),
      )[0],
    ).toMatch(/id/);
  });

  it('signale des identifiants en double', () => {
    const errors = expectErrors(
      validateGoalsPayload({ goals: [validGoal, { ...validGoal, title: 'Doublon' }] }),
    );
    expect(errors[0]).toMatch(/double/);
  });

  it('signale un champ texte du mauvais type', () => {
    const errors = expectErrors(validateGoalsPayload({ goals: [{ ...validGoal, why: 42 }] }));
    expect(errors[0]).toMatch(/why/);
  });

  it('rejette le fichier entier dès qu’un objectif est invalide', () => {
    const result = validateGoalsPayload({
      goals: [validGoal, { ...validGoal, id: 'g2', area: 'inconnu' }],
    });
    expect(result.ok).toBe(false);
  });
});

describe('import — champs optionnels', () => {
  it('remplace les champs texte absents par une chaîne vide', () => {
    const result = validateGoalsPayload({
      goals: [{ id: 'g1', title: 'Minimal', area: 'home' }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.goals[0]).toMatchObject({
      why: '',
      successCriteria: '',
      reward: '',
      status: 'not_started',
      steps: [],
    });
    expect(result.goals[0]?.deadline).toBeUndefined();
  });

  it('traite une deadline vide ou nulle comme absente', () => {
    const vide = validateGoalsPayload({ goals: [{ ...validGoal, deadline: '' }] });
    const nulle = validateGoalsPayload({ goals: [{ ...validGoal, deadline: null }] });
    expect(vide.ok && vide.goals[0]?.deadline).toBeUndefined();
    expect(nulle.ok && nulle.goals[0]?.deadline).toBeUndefined();
  });

  it('remplace un horodatage illisible par une date valide', () => {
    const result = validateGoalsPayload({
      goals: [{ ...validGoal, createdAt: 'jamais', updatedAt: 12 }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Number.isNaN(new Date(result.goals[0]!.createdAt).getTime())).toBe(false);
    expect(Number.isNaN(new Date(result.goals[0]!.updatedAt).getTime())).toBe(false);
  });
});
