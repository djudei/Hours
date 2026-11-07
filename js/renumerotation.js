// Renumérotation des projets quand le format des N° change (repris de Renumerotation.gs) :
// les projets reçoivent leur nouveau N° dans l'ordre chronologique, comme s'ils avaient été créés avec ce format.
// Rien ne change sans confirmation (aperçu ancien → nouveau). Calculs purs.
import { prochainNumero, lettresClient, FORMAT_CLIENT } from './numerotation.js';
import { t } from './textes.js';

/**
 * projets : ceux de la personne (sans ceux de l'équipe) ; premieresSaisies : { code: "2026-10-03" } ;
 * codesReserves : N° pris ailleurs (projets de l'équipe), jamais réattribués.
 * Renvoie [{ ancien, nouveau, nom, creeLe, numeroLigne }] dans l'ordre de l'onglet Projects.
 */
export function planRenumerotation(format, projets, premieresSaisies, aujourdhui, codesReserves) {
  const dates = projets.map((p) => p.creeLe || premieresSaisies[p.code] || aujourdhui);
  const ordre = projets.map((_, i) => i).sort((a, b) => (dates[a] < dates[b] ? -1 : dates[a] > dates[b] ? 1 : a - b));
  const attribues = [...codesReserves];
  const nouveaux = [];
  ordre.forEach((i) => {
    const projet = projets[i];
    const [annee, mois] = dates[i].split('-').map(Number);
    const lettres = format === FORMAT_CLIENT ? lettresClient(projet.nom) : '';
    if (format === FORMAT_CLIENT && !lettres) throw new Error(t('numero.erreur.sansLettres', { nom: projet.nom }));
    const nouveau = prochainNumero(format, attribues, { annee, mois }, lettres, projet.type);
    attribues.push(nouveau);
    nouveaux[i] = nouveau;
  });
  return projets.map((p, i) => ({ ancien: p.code, nouveau: nouveaux[i], nom: p.nom, creeLe: dates[i], numeroLigne: p.numeroLigne }));
}

/**
 * Date du premier créneau attribué à chaque N°.
 */
export function premieresSaisiesParCode(saisies) {
  return saisies.reduce((premieres, s) => {
    if (s.code && s.date && (!premieres[s.code] || s.date < premieres[s.code])) return { ...premieres, [s.code]: s.date };
    return premieres;
  }, {});
}

/**
 * Colonne « Project code » réécrite d'après la correspondance { ancien: nouveau } (le reste ne bouge pas).
 */
export function colonneRenumerotee(saisies, correspondance) {
  return saisies.map((s) => [Object.hasOwn(correspondance, s.code) ? correspondance[s.code] : s.code]);
}
