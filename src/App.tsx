import { useState } from 'react';
import { Layout } from './components/Layout';
import type { GoalDraft } from './domain/factory';
import { useGoals } from './hooks/useGoals';
import type { NavSection, View } from './navigation';
import { sectionOf } from './navigation';
import { DashboardPage } from './pages/DashboardPage';
import { GoalDetailPage } from './pages/GoalDetailPage';
import { GoalsListPage } from './pages/GoalsListPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const { goals, addGoal, editGoal, removeGoal, replaceGoals, resetGoals } = useGoals();
  const [view, setView] = useState<View>({ kind: 'dashboard' });

  function navigate(section: NavSection) {
    setView({ kind: section });
  }

  function openGoal(id: string) {
    setView({ kind: 'goal', id });
  }

  const selected = view.kind === 'goal' ? goals.find((goal) => goal.id === view.id) : undefined;

  function handleCreate(draft: GoalDraft) {
    openGoal(addGoal(draft));
  }

  function handleUpdate(id: string, draft: GoalDraft) {
    editGoal(id, draft);
    setView({ kind: 'goals' });
  }

  function handleDelete(id: string) {
    removeGoal(id);
    setView({ kind: 'goals' });
  }

  return (
    <Layout active={sectionOf(view)} onNavigate={navigate}>
      {view.kind === 'dashboard' && <DashboardPage goals={goals} onOpenGoal={openGoal} />}

      {view.kind === 'goals' && (
        <GoalsListPage
          goals={goals}
          onOpenGoal={openGoal}
          onCreateGoal={() => setView({ kind: 'new' })}
        />
      )}

      {view.kind === 'new' && (
        <GoalDetailPage
          goal={null}
          onSave={handleCreate}
          onCancel={() => setView({ kind: 'goals' })}
        />
      )}

      {view.kind === 'goal' &&
        (selected ? (
          <GoalDetailPage
            goal={selected}
            onSave={(draft) => handleUpdate(selected.id, draft)}
            onCancel={() => setView({ kind: 'goals' })}
            onDelete={() => handleDelete(selected.id)}
          />
        ) : (
          <div>
            <p className="text-sm text-slate-400">Cet objectif n’existe plus.</p>
            <button
              type="button"
              onClick={() => setView({ kind: 'goals' })}
              className="mt-3 rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Retour aux objectifs
            </button>
          </div>
        ))}

      {view.kind === 'settings' && (
        <SettingsPage goals={goals} onImport={replaceGoals} onReset={resetGoals} />
      )}
    </Layout>
  );
}
