import { useId, useState } from 'react';
import { addStep, moveStep, removeStep, renameStep, toggleStep } from '../domain/steps';
import type { Step } from '../domain/types';
import { newId } from '../lib/id';

interface StepListProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

const ICON_BUTTON =
  'rounded-md border border-line px-2 py-1 text-xs text-ink-dim hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent';

export function StepList({ steps, onChange }: StepListProps) {
  const [draft, setDraft] = useState('');
  const newStepId = useId();

  function submitNewStep() {
    const label = draft.trim();
    if (!label) return;
    onChange(addStep(steps, label, newId()));
    setDraft('');
  }

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-2"
          >
            <input
              type="checkbox"
              id={`step-${step.id}`}
              checked={step.done}
              onChange={() => onChange(toggleStep(steps, step.id))}
              className="size-4 shrink-0 accent-accent-strong"
            />
            <label htmlFor={`step-${step.id}`} className="sr-only">
              Étape terminée : {step.label}
            </label>

            <input
              type="text"
              value={step.label}
              onChange={(event) => onChange(renameStep(steps, step.id, event.target.value))}
              aria-label={`Intitulé de l’étape ${index + 1}`}
              className={`min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm hover:border-line focus:border-accent ${
                step.done ? 'text-ink-dim line-through' : 'text-ink'
              }`}
            />

            <button
              type="button"
              className={ICON_BUTTON}
              onClick={() => onChange(moveStep(steps, index, -1))}
              disabled={index === 0}
              aria-label={`Monter l’étape ${index + 1}`}
            >
              ↑
            </button>
            <button
              type="button"
              className={ICON_BUTTON}
              onClick={() => onChange(moveStep(steps, index, 1))}
              disabled={index === steps.length - 1}
              aria-label={`Descendre l’étape ${index + 1}`}
            >
              ↓
            </button>
            <button
              type="button"
              className={`${ICON_BUTTON} hover:border-danger hover:text-danger-ink`}
              onClick={() => onChange(removeStep(steps, step.id))}
              aria-label={`Supprimer l’étape ${index + 1}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {steps.length === 0 && (
        <p className="text-sm text-ink-dim">Aucune étape pour l’instant.</p>
      )}

      <div className="mt-3 flex gap-2">
        <label htmlFor={newStepId} className="sr-only">
          Nouvelle étape
        </label>
        <input
          id={newStepId}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Entrée valide l'étape sans soumettre le formulaire parent.
            if (event.key === 'Enter') {
              event.preventDefault();
              submitNewStep();
            }
          }}
          placeholder="Ajouter une étape"
          className="min-w-0 flex-1 rounded-md border border-line bg-surface-2 px-3 py-2 text-sm placeholder:text-ink-dim"
        />
        <button
          type="button"
          onClick={submitNewStep}
          disabled={draft.trim() === ''}
          className="rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-surface-2 disabled:opacity-40"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
