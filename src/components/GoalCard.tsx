import { progress, progressPercent } from '../domain/goals';
import type { Goal } from '../domain/types';
import { AreaBadge, DeadlineBadge, StatusBadge } from './Badges';
import { ProgressBar } from './ProgressBar';

interface GoalCardProps {
  goal: Goal;
  onOpen: (id: string) => void;
  today?: Date;
}

export function GoalCard({ goal, onOpen, today }: GoalCardProps) {
  const done = goal.steps.filter((step) => step.done).length;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700">
      <h3 className="text-base font-semibold">
        <button
          type="button"
          onClick={() => onOpen(goal.id)}
          className="rounded text-left text-slate-100 hover:text-sky-300"
        >
          {goal.title}
        </button>
      </h3>

      <div className="mt-2 flex flex-wrap gap-2">
        <AreaBadge area={goal.area} />
        <StatusBadge status={goal.status} />
        <DeadlineBadge goal={goal} {...(today ? { today } : {})} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={progress(goal)} label={`Avancement de « ${goal.title} »`} />
        <span className="shrink-0 text-xs text-slate-400 tabular-nums">
          {progressPercent(goal)} %
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-400">
        {goal.steps.length === 0
          ? 'Aucune étape'
          : `${done} / ${goal.steps.length} étape${goal.steps.length > 1 ? 's' : ''}`}
      </p>
    </article>
  );
}
