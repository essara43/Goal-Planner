import { formatArea } from '../domain/areas';
import type { Goal, GoalStatus, LifeAreaId } from '../domain/types';
import { daysLeft, isOverdue } from '../domain/goals';
import { STATUS_LABELS, formatDate, formatDaysLeft } from '../lib/format';

const BASE = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium';

const STATUS_STYLES: Record<GoalStatus, string> = {
  not_started: 'bg-slate-800 text-slate-300',
  in_progress: 'bg-sky-950 text-sky-300',
  achieved: 'bg-emerald-950 text-emerald-300',
};

export function StatusBadge({ status }: { status: GoalStatus }) {
  return <span className={`${BASE} ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function AreaBadge({ area }: { area: LifeAreaId }) {
  return <span className={`${BASE} bg-slate-800 text-slate-200`}>{formatArea(area)}</span>;
}

interface DeadlineBadgeProps {
  goal: Goal;
  today?: Date;
}

/** Affiche l'échéance, avec un style dédié dès que l'objectif est en retard. */
export function DeadlineBadge({ goal, today = new Date() }: DeadlineBadgeProps) {
  const left = daysLeft(goal, today);
  const label = formatDaysLeft(left);
  if (!goal.deadline || label === null) return null;

  const late = isOverdue(goal, today);
  const style = late ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-300';

  return (
    <span className={`${BASE} ${style}`}>
      {late && (
        <span aria-hidden="true" className="text-rose-400">
          ⚠
        </span>
      )}
      <time dateTime={goal.deadline}>{formatDate(goal.deadline)}</time>
      <span className="text-slate-500" aria-hidden="true">
        ·
      </span>
      {label}
    </span>
  );
}
