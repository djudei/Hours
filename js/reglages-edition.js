// Réglages : contrôle des valeurs saisies et ce qu'il faut écrire dans l'onglet Settings (repris de Reglages.gs),
// plus le renommage des intitulés de la ToDo (la ligne de l'onglet Workload suit, comme dans Charge.gs). Calculs purs.
import { lireHeuresParJour, lireTitresConges, lireDateSuivi } from './regles.js';
import { t } from './textes.js';
import { FORMATS_NUMERO, FORMAT_NUMERO_PAR_DEFAUT } from './numerotation.js';

const JOURS_SEMAINE = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const ORDRE_JOURS = [1, 2, 3, 4, 5, 6, 0];
const LONGUEUR_MAX_PRENOM = 60;
const LONGUEUR_MAX_CATEGORIE = 30;
const TITRES_CONGES_MAX = 20;
const LONGUEUR_MAX_TITRE_CONGE = 40;
const INTITULES_MAX = 5;
const LONGUEUR_MAX_INTITULE = 40;
const RESERVES = ['Modified', 'Title'];
const OUI = 'yes';
const NON = 'no';

const texte = (valeur) => String(valeur ?? '').trim().replace(/\s+/g, ' ');

export function ecrireHeuresParJour(minutes) {
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
}

export function ecrireJoursTravailles(jours) {
  return ORDRE_JOURS.filter((j) => jours.includes(j)).map((j) => JOURS_SEMAINE[j]).join(', ');
}

function verifierTemps(temps) {
  const minutes = lireHeuresParJour(temps.heuresParJour);
  if (minutes === null) throw new Error(t('reglages.erreur.heures', { heures: texte(temps.heuresParJour) }));
  const jours = (temps.jours || []).map(Number).filter((j) => j >= 0 && j <= 6);
  if (!jours.length) throw new Error(t('reglages.erreur.jours'));
  const titres = lireTitresConges(temps.titresConges);
  if (!titres) throw new Error(t('reglages.erreur.conges'));
  if (titres.length > TITRES_CONGES_MAX) throw new Error(t('reglages.erreur.congesNombre', { max: TITRES_CONGES_MAX }));
  const long = titres.find((titre) => titre.length > LONGUEUR_MAX_TITRE_CONGE);
  if (long) throw new Error(t('reglages.erreur.congeLong', { max: LONGUEUR_MAX_TITRE_CONGE, titre: long }));
  return { minutesParJour: minutes, jours: ORDRE_JOURS.filter((j) => jours.includes(j)), avecBase: temps.avecBase !== false, titresConges: titres };
}

function verifierIntitules(cases) {
  if (cases.length > INTITULES_MAX) throw new Error(t('reglages.erreur.intitulesNombre', { max: INTITULES_MAX }));
  const propres = cases.map(texte);
  const remplis = propres.filter(Boolean);
  if (!remplis.length) throw new Error(t('reglages.erreur.intituleVide'));
  const vus = new Set();
  remplis.forEach((intitule) => {
    if (intitule.includes('|')) throw new Error(t('reglages.erreur.separateur', { intitule }));
    if (intitule.length > LONGUEUR_MAX_INTITULE) throw new Error(t('reglages.erreur.intituleLong', { max: LONGUEUR_MAX_INTITULE, intitule }));
    if (RESERVES.includes(intitule)) throw new Error(t('reglages.erreur.reserve', { intitule }));
    if (vus.has(intitule.toLowerCase())) throw new Error(t('reglages.erreur.intituleDouble', { intitule }));
    vus.add(intitule.toLowerCase());
  });
  return propres;
}

function verifierCategories(nomProjet, nomAutre) {
  const projet = texte(nomProjet) || t('categorie.projet');
  const autre = texte(nomAutre);
  [projet, autre].forEach((nom) => {
    if (nom.length > LONGUEUR_MAX_CATEGORIE) throw new Error(t('reglages.erreur.categorieLongue', { max: LONGUEUR_MAX_CATEGORIE, nom }));
  });
  const interne = t('categorie.interne').toLowerCase();
  if (projet.toLowerCase() === interne || (autre && [projet.toLowerCase(), interne].includes(autre.toLowerCase()))) {
    throw new Error(t('reglages.erreur.categoriesEgales'));
  }
  return { projet, autre };
}

/**
 * Valeurs saisies → valeurs propres ; erreur claire sinon (rien n'est écrit).
 * intitulesCharge : une case par intitulé (position gardée pour repérer les renommages), '' = vide.
 */
export function verifierReglages(saisie) {
  const prenom = texte(saisie.prenom);
  if (!prenom) throw new Error(t('reglages.erreur.prenom'));
  if (prenom.length > LONGUEUR_MAX_PRENOM) throw new Error(t('reglages.erreur.prenomLong', { max: LONGUEUR_MAX_PRENOM }));
  const debutSuivi = lireDateSuivi(saisie.debutSuivi);
  if (texte(saisie.debutSuivi) && !debutSuivi) throw new Error(t('reglages.erreur.debut', { date: texte(saisie.debutSuivi) }));
  const intitulesChargeCases = verifierIntitules(saisie.intitulesCharge);
  const categories = verifierCategories(saisie.nomCategorieProjet, saisie.nomCategorieAutre);
  const formatNumero = texte(saisie.formatNumero) || FORMAT_NUMERO_PAR_DEFAUT;
  if (!FORMATS_NUMERO.includes(formatNumero)) throw new Error(t('numero.erreur.format', { format: formatNumero }));
  return {
    prenom, debutSuivi, formatNumero, tempsDeTravail: verifierTemps(saisie.tempsDeTravail), intitulesChargeCases,
    intitulesCharge: intitulesChargeCases.filter(Boolean),
    nomCategorieProjet: categories.projet, nomCategorieAutre: categories.autre
  };
}

/**
 * Lignes de l'onglet Settings + valeurs propres → { modifications: [{ plage, valeurs }], ajouts: [[libellé, valeur]] }.
 * Libellé en double : la première ligne compte (comme dans l'appli actuelle).
 */
export function planReglages(lignes, propres) {
  const valeurs = [
    ['First name', propres.prenom],
    ['Tracking start', propres.debutSuivi],
    ['Project number format', propres.formatNumero],
    ['Hours per day', ecrireHeuresParJour(propres.tempsDeTravail.minutesParJour)],
    ['Working days', ecrireJoursTravailles(propres.tempsDeTravail.jours)],
    ['Calculate baseline', propres.tempsDeTravail.avecBase ? OUI : NON],
    ['Time-off titles', propres.tempsDeTravail.titresConges.join(', ')],
    ['Projects name (1XX)', propres.nomCategorieProjet],
    ['3rd category name (2XX)', propres.nomCategorieAutre],
    ['Workload titles', propres.intitulesCharge.join(' | ')]
  ];
  const ligneDe = new Map();
  lignes.forEach((ligne, i) => {
    const etiquette = texte(ligne[0]);
    if (etiquette && !ligneDe.has(etiquette)) ligneDe.set(etiquette, i + 1);
  });
  return {
    modifications: valeurs.filter(([e]) => ligneDe.has(e)).map(([e, v]) => ({ plage: `Settings!B${ligneDe.get(e)}`, valeurs: [[v]] })),
    ajouts: valeurs.filter(([e]) => !ligneDe.has(e))
  };
}

/**
 * Intitulés renommés : même case, autre texte → { ancien: nouveau }.
 */
export function renommagesIntitules(anciens, nouveaux) {
  return Object.fromEntries(anciens.map((ancien, i) => [ancien, nouveaux[i]]).filter(([ancien, nouveau]) => ancien && nouveau && ancien !== nouveau));
}

/**
 * Renomme des lignes du tableau de la ToDo (échanges compris). Nouveau nom déjà pris par une ligne avec des missions :
 * on n'écrit pas, on signale.
 */
export function appliquerRenommages(tableau, renommages) {
  const nom = (intitule) => (Object.hasOwn(renommages, intitule) ? renommages[intitule] : intitule);
  const restants = tableau.intitules.filter((i) => !Object.hasOwn(renommages, i));
  Object.entries(renommages).forEach(([ancien, cible]) => {
    const occupe = restants.includes(cible) && Object.values(tableau.mois).some((cases) => Boolean(cases[cible]));
    if (occupe) throw new Error(t('reglages.erreur.renommer', { ancien, cible }));
  });
  const cibles = Object.values(renommages);
  const intitules = [];
  tableau.intitules.forEach((intitule) => {
    if (!Object.hasOwn(renommages, intitule) && cibles.includes(intitule)) return;
    if (!intitules.includes(nom(intitule))) intitules.push(nom(intitule));
  });
  const mois = Object.fromEntries(Object.entries(tableau.mois).map(([cle, cases]) =>
    [cle, Object.fromEntries(Object.entries(cases).map(([intitule, valeur]) => [nom(intitule), valeur]))]));
  return { ...tableau, intitules, mois };
}
