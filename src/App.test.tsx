import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { serializeGoals } from './domain/serialization';
import { STORAGE_KEY } from './storage/goalsStorage';
import { makeGoal, makeSteps } from './test/factories';

function seed(...goals: Parameters<typeof serializeGoals>[0]) {
  localStorage.setItem(STORAGE_KEY, serializeGoals(goals));
}

describe('parcours principal', () => {
  it('crée un objectif, l’affiche dans la liste et le compte au tableau de bord', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Objectifs' }));
    await user.click(screen.getByRole('button', { name: 'Nouvel objectif' }));

    await user.type(
      screen.getByLabelText('What do you want to achieve?'),
      'Courir un semi-marathon',
    );
    await user.selectOptions(screen.getByLabelText('Domaine de vie'), 'health_fitness');
    await user.type(screen.getByLabelText('Nouvelle étape'), 'Plan d’entraînement');
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));
    await user.click(screen.getByRole('button', { name: 'Créer l’objectif' }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Courir un semi-marathon' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Objectifs' }));
    expect(screen.getByRole('button', { name: 'Courir un semi-marathon' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tableau de bord' }));
    expect(screen.getByText('objectif atteint — 0 %')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Courir un semi-marathon');
  });

  it('recharge les objectifs déjà stockés', () => {
    seed(makeGoal({ title: 'Épargne de précaution', status: 'achieved' }));
    render(<App />);
    expect(screen.getByText('objectif atteint — 100 %')).toBeInTheDocument();
  });

  it('filtre la liste par recherche textuelle', async () => {
    const user = userEvent.setup();
    seed(
      makeGoal({ title: 'Courir un semi', area: 'health_fitness' }),
      makeGoal({ title: 'Apprendre la poterie', area: 'fun_hobbies' }),
    );
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Objectifs' }));
    await user.type(screen.getByLabelText('Rechercher dans les titres'), 'poterie');

    expect(screen.getByRole('button', { name: 'Apprendre la poterie' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Courir un semi' })).not.toBeInTheDocument();
  });

  it('coche la dernière étape et bascule l’objectif en atteint', async () => {
    const user = userEvent.setup();
    const steps = makeSteps([true, false]);
    seed(makeGoal({ title: 'Ranger le garage', status: 'in_progress', steps }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Objectifs' }));
    await user.click(screen.getByRole('button', { name: 'Ranger le garage' }));
    await user.click(screen.getByLabelText(`Étape terminée : ${steps[1]!.label}`));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    const card = screen.getByRole('button', { name: 'Ranger le garage' }).closest('article');
    expect(within(card!).getByText('Atteint')).toBeInTheDocument();
  });

  it('supprime un objectif après confirmation', async () => {
    const user = userEvent.setup();
    seed(makeGoal({ title: 'À supprimer' }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Objectifs' }));
    await user.click(screen.getByRole('button', { name: 'À supprimer' }));
    await user.click(screen.getByRole('button', { name: 'Supprimer l’objectif' }));
    await user.click(screen.getByRole('button', { name: 'Oui, supprimer' }));

    expect(screen.queryByRole('button', { name: 'À supprimer' })).not.toBeInTheDocument();
    expect(screen.getByText(/Aucun objectif pour l’instant/)).toBeInTheDocument();
  });
});

describe('paramètres', () => {
  it('refuse un import invalide en listant les erreurs et conserve les données', async () => {
    const user = userEvent.setup();
    seed(makeGoal({ title: 'À conserver' }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Paramètres' }));
    const file = new File([JSON.stringify({ goals: [{ id: 'x' }] })], 'invalide.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText('Fichier JSON à importer'), file);

    expect(await screen.findByRole('alert')).toHaveTextContent('Import refusé');
    await user.click(screen.getByRole('button', { name: 'Objectifs' }));
    expect(screen.getByRole('button', { name: 'À conserver' })).toBeInTheDocument();
  });

  it('remplace les données par un import valide', async () => {
    const user = userEvent.setup();
    seed(makeGoal({ title: 'Ancien objectif' }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Paramètres' }));
    const payload = serializeGoals([makeGoal({ title: 'Objectif importé' })]);
    await user.upload(
      screen.getByLabelText('Fichier JSON à importer'),
      new File([payload], 'export.json', { type: 'application/json' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent('1 objectif importé');
    await user.click(screen.getByRole('button', { name: 'Objectifs' }));
    expect(screen.getByRole('button', { name: 'Objectif importé' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ancien objectif' })).not.toBeInTheDocument();
  });

  it('réinitialise après confirmation explicite', async () => {
    const user = userEvent.setup();
    seed(makeGoal({ title: 'À effacer' }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Paramètres' }));
    await user.click(screen.getByRole('button', { name: 'Réinitialiser les données' }));
    expect(screen.getByText(/Action irréversible/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Oui, tout supprimer' }));
    await user.click(screen.getByRole('button', { name: 'Objectifs' }));
    expect(screen.getByText(/Aucun objectif pour l’instant/)).toBeInTheDocument();
  });
});
