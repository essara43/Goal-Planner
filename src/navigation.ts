/**
 * Navigation interne, sans routeur : l'app tient en quatre écrans et n'a pas
 * besoin d'URL partageables. En contrepartie, le bouton « retour » du
 * navigateur ne remonte pas d'un écran.
 */
export type View =
  | { kind: 'dashboard' }
  | { kind: 'goals' }
  | { kind: 'new' }
  | { kind: 'goal'; id: string }
  | { kind: 'settings' };

export type NavSection = 'dashboard' | 'goals' | 'settings';

export function sectionOf(view: View): NavSection {
  switch (view.kind) {
    case 'dashboard':
      return 'dashboard';
    case 'settings':
      return 'settings';
    default:
      return 'goals';
  }
}
