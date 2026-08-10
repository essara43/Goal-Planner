import { getArea } from '../domain/areas';
import { UPCOMING_WINDOW_DAYS, buildDashboard } from '../domain/dashboard';
import type { Goal } from '../domain/types';
import { formatPercent } from '../lib/format';
import { GoalCard } from '../components/GoalCard';
import { ProgressBar } from '../components/ProgressBar';

interface DashboardPageProps {
  goals: Goal[];
  onOpenGoal: (id: string) => void;
  /** Injectable pour figer la date dans les tests. */
  today?: Date;
}

export function DashboardPage({ goals, onOpenGoal, today = new Date() }: DashboardPageProps) {
  const { overall, byArea, upcoming } = buildDashboard(goals, today);

  const plural = overall.achieved > 1 ? 's' : '';
  const summary =
    overall.total === 0
      ? 'Aucun objectif enregistré'
      : `objectif${plural} atteint${plural} — ${formatPercent(overall.ratio)}`;

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="progression-globale">
        <h1 id="progression-globale" className="text-xl font-semibold">
          Progression globale
        </h1>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-3xl font-semibold tabular-nums">
            {overall.achieved}{' '}
            <span className="text-slate-500">/ {overall.total}</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">{summary}</p>
          <div className="mt-4">
            <ProgressBar value={overall.ratio} label="Progression globale" />
          </div>
        </div>
      </section>

      <section aria-labelledby="par-domaine">
        <h2 id="par-domaine" className="text-xl font-semibold">
          Par domaine de vie
        </h2>
        {byArea.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Aucun objectif enregistré pour l’instant.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-md text-sm">
              <caption className="sr-only">
                Répartition des objectifs par domaine de vie
              </caption>
              <thead className="bg-slate-900 text-left text-slate-300">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Domaine
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Objectifs
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Atteints
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {byArea.map((row) => {
                  const area = getArea(row.areaId);
                  return (
                    <tr key={row.areaId}>
                      <th scope="row" className="px-4 py-2 text-left font-normal text-slate-100">
                        <span aria-hidden="true">{area.emoji}</span> {area.label}
                      </th>
                      <td className="px-4 py-2 text-right tabular-nums">{row.count}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{row.achieved}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatPercent(row.ratio)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="echeances">
        <h2 id="echeances" className="text-xl font-semibold">
          Échéances à moins de {UPCOMING_WINDOW_DAYS} jours
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            Aucune échéance proche. Les objectifs atteints ne sont pas listés ici.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {upcoming.map((entry) => (
              <li key={entry.goal.id}>
                <GoalCard goal={entry.goal} onOpen={onOpenGoal} today={today} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
