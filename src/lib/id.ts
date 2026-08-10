/**
 * Identifiant unique pour un objectif ou une étape.
 *
 * `crypto.randomUUID` n'est exposé que dans un contexte sécurisé (https ou
 * localhost) ; le repli couvre le cas où l'app serait ouverte autrement.
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
