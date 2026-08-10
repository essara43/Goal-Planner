import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { GoalDraft } from '../domain/factory';
import { createGoal, updateGoal } from '../domain/factory';
import type { Goal } from '../domain/types';
import { newId } from '../lib/id';
import { clearGoals, loadGoals, saveGoals } from '../storage/goalsStorage';

type Action =
  | { type: 'create'; draft: GoalDraft; id: string; now: string }
  | { type: 'update'; id: string; draft: GoalDraft; now: string }
  | { type: 'delete'; id: string }
  | { type: 'replaceAll'; goals: Goal[] };

export function goalsReducer(state: Goal[], action: Action): Goal[] {
  switch (action.type) {
    case 'create':
      return [...state, createGoal(action.draft, action.id, action.now)];
    case 'update':
      return state.map((goal) =>
        goal.id === action.id ? updateGoal(goal, action.draft, action.now) : goal,
      );
    case 'delete':
      return state.filter((goal) => goal.id !== action.id);
    case 'replaceAll':
      return action.goals;
  }
}

export interface UseGoals {
  goals: Goal[];
  /** Renvoie l'identifiant du nouvel objectif, pour ouvrir sa fiche. */
  addGoal: (draft: GoalDraft) => string;
  editGoal: (id: string, draft: GoalDraft) => void;
  removeGoal: (id: string) => void;
  /** Remplace l'intégralité des données (import JSON). */
  replaceGoals: (goals: Goal[]) => void;
  /** Supprime toutes les données, en mémoire et sur le disque. */
  resetGoals: () => void;
}

/**
 * Point d'accès unique aux objectifs : état en mémoire (`useReducer`) et
 * persistance localStorage, de sorte qu'aucun composant ne touche au stockage.
 */
export function useGoals(): UseGoals {
  const [goals, dispatch] = useReducer(goalsReducer, undefined, loadGoals);

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  const addGoal = useCallback((draft: GoalDraft) => {
    const id = newId();
    dispatch({ type: 'create', draft, id, now: new Date().toISOString() });
    return id;
  }, []);

  const editGoal = useCallback((id: string, draft: GoalDraft) => {
    dispatch({ type: 'update', id, draft, now: new Date().toISOString() });
  }, []);

  const removeGoal = useCallback((id: string) => {
    dispatch({ type: 'delete', id });
  }, []);

  const replaceGoals = useCallback((next: Goal[]) => {
    dispatch({ type: 'replaceAll', goals: next });
  }, []);

  const resetGoals = useCallback(() => {
    dispatch({ type: 'replaceAll', goals: [] });
    clearGoals();
  }, []);

  return useMemo(
    () => ({ goals, addGoal, editGoal, removeGoal, replaceGoals, resetGoals }),
    [goals, addGoal, editGoal, removeGoal, replaceGoals, resetGoals],
  );
}
