import { formatArea } from '../domain/areas';
import type { Goal, GoalStatus, LifeAreaId } from '../domain/types';
import { daysLeft, isOverdue } from '../domain/goals';
import { STATUS_LABELS, formatDate, formatDaysLeft } from '../lib/format';

const BASE = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium';

const STATUS_STYLES: Record<GoalStatus, string> = {
  not_started: 'bg-surface-2 text-ink',
  in_progress: 'bg-info-soft text-info-ink',
  achieved: 'bg-mint-soft text-mint-ink',
};

export function StatusBadge({ status }: { status: GoalStatus }) {
  return <span className={`${BASE} ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function AreaBadge({ area }: { area: LifeAreaId }) {
  return <span className={`${BASE} bg-surface-2 text-ink`}>{formatArea(area)}</span>;
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
  const style = late ? 'bg-danger-soft text-danger-ink' : 'bg-surface-2 text-ink';

  return (
    <span className={`${BASE} ${style}`}>
      {late && (
        <span aria-hidden="true" className="text-danger-ink">
          ⚠
        </span>
      )}
      <time dateTime={goal.deadline}>{formatDate(goal.deadline)}</time>
      <span className="text-accent-soft" aria-hidden="true">
        ·
      </span>
      {label}
    </span>
  );
}
