import { emptyDraft, toDraft } from '../domain/factory';
import type { GoalDraft } from '../domain/factory';
import { progressPercent } from '../domain/goals';
import type { Goal } from '../domain/types';
import { DeadlineBadge, StatusBadge } from '../components/Badges';
import { GoalForm } from '../components/GoalForm';
import { ProgressBar } from '../components/ProgressBar';

interface GoalDetailPageProps {
  /** `null` pour une création. */
  goal: Goal | null;
  onSave: (draft: GoalDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
  today?: Date;
}

export function GoalDetailPage({
  goal,
  onSave,
  onCancel,
  onDelete,
  today,
}: GoalDetailPageProps) {
  const creating = goal === null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-ink-dim hover:text-ink"
        >
          ← Retour aux objectifs
        </button>
        <h1 className="mt-2 text-xl font-semibold">
          {creating ? 'Nouvel objectif' : goal.title}
        </h1>
      </div>

      {goal && (
        <div className="rounded-xl border border-line bg-surface p-4 shadow-soft">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={goal.status} />
            <DeadlineBadge goal={goal} {...(today ? { today } : {})} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={progressPercent(goal) / 100} label="Avancement de l’objectif" />
            <span className="shrink-0 text-xs text-ink-dim tabular-nums">
              {progressPercent(goal)} %
            </span>
          </div>
        </div>
      )}

      <GoalForm
        key={goal?.id ?? 'new'}
        initialDraft={goal ? toDraft(goal) : emptyDraft()}
        submitLabel={creating ? 'Créer l’objectif' : 'Enregistrer'}
        onSubmit={onSave}
        onCancel={onCancel}
        {...(onDelete ? { onDelete } : {})}
      />
    </div>
  );
}
