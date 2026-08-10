import { useId, useMemo, useState } from 'react';
import { LIFE_AREAS } from '../domain/areas';
import { DEFAULT_FILTERS, filterGoals, sortGoals } from '../domain/goals';
import type { GoalFilters, SortKey } from '../domain/goals';
import type { Goal, GoalStatus, LifeAreaId } from '../domain/types';
import { STATUS_LABELS } from '../lib/format';
import { GoalCard } from '../components/GoalCard';

const FIELD =
  'rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-dim';
const LABEL = 'mb-1 block text-xs font-medium text-ink-dim';

interface GoalsListPageProps {
  goals: Goal[];
  onOpenGoal: (id: string) => void;
  onCreateGoal: () => void;
  today?: Date;
}

export function GoalsListPage({
  goals,
  onOpenGoal,
  onCreateGoal,
  today,
}: GoalsListPageProps) {
  const [filters, setFilters] = useState<GoalFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>('deadline');
  const ids = useId();
  const field = (name: string) => `${ids}-${name}`;

  const visible = useMemo(
    () => sortGoals(filterGoals(goals, filters), sort),
    [goals, filters, sort],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Mes objectifs</h1>
        <button
          type="button"
          onClick={onCreateGoal}
          className="rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent"
        >
          Nouvel objectif
        </button>
      </div>

      <section aria-label="Filtres" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor={field('query')} className={LABEL}>
            Rechercher dans les titres
          </label>
          <input
            id={field('query')}
            type="search"
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({ ...current, query: event.target.value }))
            }
            placeholder="semi-marathon"
            className={`${FIELD} w-full`}
          />
        </div>

        <div>
          <label htmlFor={field('area')} className={LABEL}>
            Domaine de vie
          </label>
          <select
            id={field('area')}
            value={filters.area}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                area: event.target.value as LifeAreaId | 'all',
              }))
            }
            className={`${FIELD} w-full`}
          >
            <option value="all">Tous les domaines</option>
            {LIFE_AREAS.map((area) => (
              <option key={area.id} value={area.id}>
                {area.emoji} {area.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={field('status')} className={LABEL}>
            Statut
          </label>
          <select
            id={field('status')}
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as GoalStatus | 'all',
              }))
            }
            className={`${FIELD} w-full`}
          >
            <option value="all">Tous les statuts</option>
            {(Object.keys(STATUS_LABELS) as GoalStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={field('sort')} className={LABEL}>
            Trier par
          </label>
          <select
            id={field('sort')}
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className={`${FIELD} w-full`}
          >
            <option value="deadline">Échéance la plus proche</option>
            <option value="progress">Avancement décroissant</option>
          </select>
        </div>
      </section>

      <p role="status" className="text-sm text-ink-dim">
        {visible.length} objectif{visible.length > 1 ? 's' : ''} affiché
        {visible.length > 1 ? 's' : ''} sur {goals.length}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-ink-dim">
          {goals.length === 0
            ? 'Aucun objectif pour l’instant. Commence par en créer un.'
            : 'Aucun objectif ne correspond à ces filtres.'}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((goal) => (
            <li key={goal.id}>
              <GoalCard goal={goal} onOpen={onOpenGoal} {...(today ? { today } : {})} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
