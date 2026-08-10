import { useId, useState } from 'react';
import { LIFE_AREAS } from '../domain/areas';
import type { GoalDraft } from '../domain/factory';
import type { GoalStatus, LifeAreaId, Step } from '../domain/types';
import { STATUS_LABELS } from '../lib/format';
import { StepList } from './StepList';

const FIELD =
  'w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-dim';
const LABEL = 'mb-1 block text-sm font-medium text-ink';

interface GoalFormProps {
  initialDraft: GoalDraft;
  submitLabel: string;
  onSubmit: (draft: GoalDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function GoalForm({
  initialDraft,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: GoalFormProps) {
  const [draft, setDraft] = useState<GoalDraft>(initialDraft);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const ids = useId();

  const field = (name: string) => `${ids}-${name}`;

  function patch<K extends keyof GoalDraft>(key: K, value: GoalDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (draft.title.trim() === '') return;
    onSubmit(draft);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div>
        <label htmlFor={field('title')} className={LABEL}>
          What do you want to achieve?
        </label>
        <input
          id={field('title')}
          type="text"
          required
          value={draft.title}
          onChange={(event) => patch('title', event.target.value)}
          className={FIELD}
          placeholder="Courir un semi-marathon"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={field('area')} className={LABEL}>
            Domaine de vie
          </label>
          <select
            id={field('area')}
            value={draft.area}
            onChange={(event) => patch('area', event.target.value as LifeAreaId)}
            className={FIELD}
          >
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
            value={draft.status}
            onChange={(event) => patch('status', event.target.value as GoalStatus)}
            className={FIELD}
          >
            {(Object.keys(STATUS_LABELS) as GoalStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={field('deadline')} className={LABEL}>
          Échéance <span className="font-normal text-ink-dim">(optionnelle)</span>
        </label>
        <input
          id={field('deadline')}
          type="date"
          value={draft.deadline}
          onChange={(event) => patch('deadline', event.target.value)}
          className={`${FIELD} sm:w-56`}
        />
      </div>

      <div>
        <label htmlFor={field('why')} className={LABEL}>
          Why is this goal important?
        </label>
        <textarea
          id={field('why')}
          rows={3}
          value={draft.why}
          onChange={(event) => patch('why', event.target.value)}
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor={field('success')} className={LABEL}>
          How do you measure success?
        </label>
        <textarea
          id={field('success')}
          rows={3}
          value={draft.successCriteria}
          onChange={(event) => patch('successCriteria', event.target.value)}
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor={field('reward')} className={LABEL}>
          Reward
        </label>
        <input
          id={field('reward')}
          type="text"
          value={draft.reward}
          onChange={(event) => patch('reward', event.target.value)}
          className={FIELD}
        />
      </div>

      <fieldset>
        <legend className={LABEL}>Steps to reach goal</legend>
        <StepList steps={draft.steps} onChange={(steps: Step[]) => patch('steps', steps)} />
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="submit"
          disabled={draft.title.trim() === ''}
          className="rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent disabled:opacity-40"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line px-4 py-2 text-sm text-ink hover:bg-surface-2"
        >
          Annuler
        </button>

        {onDelete && (
          <div className="ms-auto flex items-center gap-2">
            {confirmingDelete ? (
              <>
                <span className="text-sm text-ink-dim">Supprimer définitivement ?</span>
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-md bg-danger-ink px-3 py-2 text-sm font-medium text-white hover:bg-danger"
                >
                  Oui, supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-surface-2"
                >
                  Non
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-md border border-danger px-3 py-2 text-sm text-danger-ink hover:bg-danger-soft"
              >
                Supprimer l’objectif
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
