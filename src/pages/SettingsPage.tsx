import { useId, useRef, useState } from 'react';
import { toDateOnly } from '../domain/goals';
import { parseGoalsFile, serializeGoals } from '../domain/serialization';
import type { Goal } from '../domain/types';
import { STORAGE_KEY } from '../storage/goalsStorage';

interface SettingsPageProps {
  goals: Goal[];
  onImport: (goals: Goal[]) => void;
  onReset: () => void;
}

type Feedback =
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string; details: string[] }
  | null;

const CARD = 'rounded-xl border border-line bg-surface p-5 shadow-soft';
const BUTTON =
  'rounded-md border border-line px-4 py-2 text-sm text-ink hover:bg-surface-2';

export function SettingsPage({ goals, onImport, onReset }: SettingsPageProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const importId = useId();

  function handleExport() {
    const blob = new Blob([serializeGoals(goals)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `goal-planner-${toDateOnly(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback({
      kind: 'success',
      message: `${goals.length} objectif${goals.length > 1 ? 's' : ''} exporté${
        goals.length > 1 ? 's' : ''
      }.`,
    });
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = parseGoalsFile(await file.text());
    if (!result.ok) {
      setFeedback({
        kind: 'error',
        message: 'Import refusé : le fichier ne correspond pas au schéma attendu.',
        details: result.errors,
      });
    } else {
      onImport(result.goals);
      setFeedback({
        kind: 'success',
        message: `${result.goals.length} objectif${
          result.goals.length > 1 ? 's' : ''
        } importé${result.goals.length > 1 ? 's' : ''}. Les données précédentes ont été remplacées.`,
      });
    }

    // Permet de réimporter le même fichier deux fois de suite.
    if (fileInput.current) fileInput.current.value = '';
  }

  function handleReset() {
    onReset();
    setConfirmingReset(false);
    setFeedback({ kind: 'success', message: 'Toutes les données locales ont été supprimées.' });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Paramètres</h1>

      {feedback && (
        <div
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border p-4 text-sm ${
            feedback.kind === 'error'
              ? 'border-danger bg-danger-soft text-danger-ink'
              : 'border-mint bg-mint-soft text-mint-ink'
          }`}
        >
          <p className="font-medium">{feedback.message}</p>
          {feedback.kind === 'error' && (
            <ul className="mt-2 list-disc space-y-1 ps-5 text-danger-ink">
              {feedback.details.slice(0, 10).map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
              {feedback.details.length > 10 && (
                <li>… et {feedback.details.length - 10} autre(s) erreur(s).</li>
              )}
            </ul>
          )}
        </div>
      )}

      <section className={CARD} aria-labelledby="export">
        <h2 id="export" className="font-semibold">
          Exporter
        </h2>
        <p className="mt-1 text-sm text-ink-dim">
          Télécharge un fichier JSON contenant tes {goals.length} objectif
          {goals.length > 1 ? 's' : ''}. C’est ta seule sauvegarde : les données ne quittent
          jamais cet appareil.
        </p>
        <button type="button" onClick={handleExport} className={`${BUTTON} mt-4`}>
          Exporter en JSON
        </button>
      </section>

      <section className={CARD} aria-labelledby="import">
        <h2 id="import" className="font-semibold">
          Importer
        </h2>
        <p className="mt-1 text-sm text-ink-dim">
          Le fichier est validé avant d’être appliqué : la moindre anomalie annule l’import
          entier. En cas de succès, les objectifs importés{' '}
          <strong className="font-medium text-ink">remplacent</strong> les objectifs
          actuels.
        </p>
        <label htmlFor={importId} className="mt-4 block text-sm font-medium text-ink">
          Fichier JSON à importer
        </label>
        <input
          id={importId}
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="mt-1 block w-full text-sm text-ink-dim file:me-3 file:rounded-md file:border file:border-line file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:text-ink hover:file:bg-line"
        />
      </section>

      <section className={CARD} aria-labelledby="reset">
        <h2 id="reset" className="font-semibold">
          Réinitialiser
        </h2>
        <p className="mt-1 text-sm text-ink-dim">
          Supprime définitivement tous les objectifs et vide la clé{' '}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">{STORAGE_KEY}</code>. Pense
          à exporter avant.
        </p>
        {confirmingReset ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink">
              Supprimer les {goals.length} objectif{goals.length > 1 ? 's' : ''} ? Action
              irréversible.
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md bg-danger-ink px-3 py-2 text-sm font-medium text-white hover:bg-danger"
            >
              Oui, tout supprimer
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className={BUTTON}
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="mt-4 rounded-md border border-danger px-4 py-2 text-sm text-danger-ink hover:bg-danger-soft"
          >
            Réinitialiser les données
          </button>
        )}
      </section>
    </div>
  );
}
