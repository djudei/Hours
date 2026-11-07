// Le Sheet Hours de la personne : création pour un nouveau venu (même structure que Classeur.gs de l'appli actuelle)
// et vérification d'un Sheet existant relié par son lien. Calculs purs.
import { t } from './textes.js';

export const EN_TETES = {
  Projects: ['Code', 'Name', 'Type', 'Status'],
  Entries: ['Id', 'Date', 'Start', 'End', 'Minutes', 'Project code', 'Source', 'Event id', 'Title', 'Auto-assigned', 'Modified']
};
// Colonnes gardées en texte brut, pour que Sheets ne transforme pas les codes, dates et heures.
const COLONNES_TEXTE = { Projects: ['Code'], Entries: ['Id', 'Date', 'Start', 'End', 'Project code', 'Event id'] };
const REGLAGES_PAR_DEFAUT = [
  ['First name', ''],
  ['Tracking start', ''],
  ['Project number format', 'YYYY-001'],
  ['Hours per day', '7h00'],
  ['Working days', 'mon, tue, wed, thu, fri'],
  ['Calculate baseline', 'yes'],
  ['Time-off titles', 'Non travaillé, Off, Congés, Congé, RTT'],
  ['Workload titles', 'Interne | Projets en cours | Projets à venir | Projets en clôture | Projets clôturés | Développement commercial'],
  ['Projects name (1XX)', 'Projets clients'],
  ['3rd category name (2XX)', ''],
  ['Sheet version', '2']
];
const LIGNES_PREPAREES = 1000;
const LARGEURS_REGLAGES = [180, 280];

const cellule = (texte, gras = false) => ({
  userEnteredValue: { stringValue: texte },
  ...(gras ? { userEnteredFormat: { textFormat: { bold: true } } } : {})
});

function onglet(titre, enTetes, colonnesTexte) {
  return {
    properties: { title: titre, gridProperties: { rowCount: LIGNES_PREPAREES, columnCount: Math.max(enTetes.length, 12), frozenRowCount: 1 } },
    data: [{ startRow: 0, startColumn: 0, rowData: [{ values: enTetes.map((e) => cellule(e, true)) }] }],
    // Format texte posé sur la colonne entière (lignes 2 à 1000), comme setNumberFormat('@') dans l'appli actuelle.
    texte: colonnesTexte.map((nom) => enTetes.indexOf(nom))
  };
}

/**
 * Corps de la demande à Google pour créer le Sheet d'un nouveau venu (« Hours », renommé ensuite d'après son prénom).
 * Le suivi commence au 1er du mois de création.
 */
export function nouveauClasseur({ aujourdhui, fuseau }) {
  const reglages = REGLAGES_PAR_DEFAUT.map(([libelle, valeur]) =>
    [libelle, libelle === 'Tracking start' ? `${aujourdhui.slice(0, 7)}-01` : valeur]);
  const projets = onglet('Projects', EN_TETES.Projects, COLONNES_TEXTE.Projects);
  const saisies = onglet('Entries', EN_TETES.Entries, COLONNES_TEXTE.Entries);
  return {
    properties: { title: 'Hours', ...(fuseau ? { timeZone: fuseau } : {}) },
    sheets: [projets, saisies, {
      properties: { title: 'Settings', gridProperties: { rowCount: LIGNES_PREPAREES, columnCount: 4 } },
      data: [{ startRow: 0, startColumn: 0, rowData: [
        { values: [cellule('Setting', true), cellule('Value', true)] },
        ...reglages.map(([libelle, valeur]) => ({ values: [cellule(libelle), cellule(valeur)] }))
      ] }]
    }].map(({ texte, ...reste }) => reste),
    colonnesTexte: { Projects: projets.texte, Entries: saisies.texte },
    largeursReglages: LARGEURS_REGLAGES
  };
}

/**
 * En-têtes lus (ligne 1 des onglets Projects et Entries, null si absent) → message si ce n'est pas un Sheet Hours, sinon ''.
 */
export function problemeStructure(enTetes) {
  for (const [nom, attendus] of Object.entries(EN_TETES)) {
    const trouves = enTetes[nom];
    if (!trouves) return t('sheet.erreur.absent', { onglet: nom });
    if (trouves.slice(0, attendus.length).join('|') !== attendus.join('|')) return t('sheet.erreur.enTetes', { onglet: nom });
  }
  return '';
}
