// Règles reprises telles quelles de l'appli Apps Script (TempsDeTravail.gs, Reglages.gs, Code.gs, Manuels.gs) :
// lecture des onglets Settings, Projects et Entries du Sheet Hours, et pré-attribution par le titre.
// Calculs purs : rien ici ne parle à Google.

export const CODES = { NON_TRAVAILLE: 'Not worked', PAUSE: 'Break', IGNORE: 'Ignored' };
export const CODES_SPECIAUX = [CODES.NON_TRAVAILLE, CODES.PAUSE, CODES.IGNORE];
export const SOURCES = { AGENDA: 'calendar', MANUEL: 'manual' };

const OUI = 'yes';
const NON = 'no';
const JOURS_SEMAINE = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const ORDRE_JOURS = [1, 2, 3, 4, 5, 6, 0];
const MINUTES_PAR_JOUR_MIN = 60;
const MINUTES_PAR_JOUR_MAX = 16 * 60;
export const TEMPS_DE_TRAVAIL_PAR_DEFAUT = Object.freeze({
  minutesParJour: 420,
  jours: Object.freeze([1, 2, 3, 4, 5]),
  avecBase: true,
  titresConges: Object.freeze(['Non travaillé', 'Off', 'Congés', 'Congé', 'RTT'])
});

// Libellés de l'onglet Settings (colonne A).
const REGLAGES = {
  prenom: 'First name',
  debutSuivi: 'Tracking start',
  heuresParJour: 'Hours per day',
  joursTravailles: 'Working days',
  base: 'Calculate baseline',
  titresConges: 'Time-off titles',
  formatNumero: 'Project number format',
  categorieProjet: 'Projects name (1XX)',
  categorieAutre: '3rd category name (2XX)',
  roleEquipe: 'Team role',
  intitulesCharge: 'Workload titles',
  mesTotaux: 'My totals'
};
const FORMATS_CONNUS = ['YYYY-001', 'YYYYMM-001', '001-YYYY-MM', '1', 'CLIENT-001', 'CATEGORY-001'];

// Type et statut d'un projet : mots du Sheet (anglais, ou anciens mots français) → repères internes.
const MOTS_SHEET_PROJETS = {
  type: { project: 'projet', other: 'autre', internal: 'interne' },
  statut: { active: 'actif', archived: 'archivé' }
};
const TYPES_PROJET = ['projet', 'autre', 'interne'];

/**
 * Texte en minuscules, sans accents ni espaces superflus.
 */
export function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * "7", "7h", "7h30", "7:30", "7,5" → minutes ; illisible ou hors limites → null.
 */
export function lireHeuresParJour(texte) {
  const valeur = String(texte ?? '').trim().toLowerCase().replace(/\s+/g, '');
  const heuresMinutes = /^(\d{1,2})(?:[h:](\d{2})?)?$/.exec(valeur);
  const decimal = /^(\d{1,2})[,.](\d{1,2})h?$/.exec(valeur);
  let minutes = null;
  if (heuresMinutes) {
    const reste = heuresMinutes[2] ? Number(heuresMinutes[2]) : 0;
    minutes = reste < 60 ? Number(heuresMinutes[1]) * 60 + reste : null;
  } else if (decimal) {
    minutes = Math.round(Number(`${decimal[1]}.${decimal[2]}`) * 60);
  }
  if (minutes === null || minutes < MINUTES_PAR_JOUR_MIN || minutes > MINUTES_PAR_JOUR_MAX) {
    return null;
  }
  return minutes;
}

/**
 * "mon, tue, wed" → [1, 2, 3] (du lundi au dimanche) ; vide ou nom inconnu → null.
 */
export function lireJoursTravailles(texte) {
  const noms = String(texte ?? '').toLowerCase().split(/[\s,;]+/).filter(Boolean);
  if (noms.length === 0) return null;
  const jours = noms.map((nom) => JOURS_SEMAINE.indexOf(nom.slice(0, 3)));
  if (jours.includes(-1)) return null;
  return ORDRE_JOURS.filter((jour) => jours.includes(jour));
}

/**
 * "Off, Congés ; RTT" → ["Off", "Congés", "RTT"] (sans doublons ni vides) ; aucun titre → null.
 */
export function lireTitresConges(texte) {
  const vus = new Set();
  const titres = String(texte ?? '').split(/[,;\n]/)
    .map((titre) => titre.trim().replace(/\s+/g, ' '))
    .filter((titre) => {
      const cle = normaliser(titre);
      if (!titre || vus.has(cle)) return false;
      vus.add(cle);
      return true;
    });
  return titres.length ? titres : null;
}

/**
 * "2026-10-01" ou "01/10/2026" → "2026-10-01" ; vide, illisible ou date impossible → "".
 */
export function lireDateSuivi(texte) {
  const valeur = String(texte ?? '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur);
  const fr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valeur);
  const morceaux = iso ? [iso[1], iso[2], iso[3]] : fr ? [fr[3], fr[2], fr[1]] : null;
  if (!morceaux) return '';
  const [a, m, j] = morceaux.map(Number);
  const date = new Date(Date.UTC(a, m - 1, j));
  const existe = date.getUTCFullYear() === a && date.getUTCMonth() + 1 === m && date.getUTCDate() === j;
  return existe ? morceaux.join('-') : '';
}

/**
 * Lignes de l'onglet Settings ([[libellé, valeur], …]) → réglages utiles à l'affichage.
 * Valeur illisible (Sheet modifié à la main) : valeur par défaut, comme dans l'appli actuelle.
 */
export function interpreterReglages(lignes) {
  const valeurs = Object.fromEntries((lignes || [])
    .filter((ligne) => ligne && String(ligne[0] ?? '').trim())
    .map((ligne) => [String(ligne[0]).trim(), String(ligne[1] ?? '').trim()]));
  return {
    prenom: valeurs[REGLAGES.prenom] || '',
    formatNumero: FORMATS_CONNUS.includes(valeurs[REGLAGES.formatNumero]) ? valeurs[REGLAGES.formatNumero] : FORMATS_CONNUS[0],
    nomCategorieProjet: valeurs[REGLAGES.categorieProjet] || '',
    nomCategorieAutre: valeurs[REGLAGES.categorieAutre] || '',
    intitulesChargeTexte: valeurs[REGLAGES.intitulesCharge] || '',
    // Équipe (version 2) : « member » + identifiant de son Sheet « mes totaux », où partent ses totaux.
    equipe: { role: valeurs[REGLAGES.roleEquipe] || '', mesTotaux: valeurs[REGLAGES.mesTotaux] || '' },
    debutSuivi: lireDateSuivi(valeurs[REGLAGES.debutSuivi]),
    tempsDeTravail: {
      minutesParJour: lireHeuresParJour(valeurs[REGLAGES.heuresParJour]) || TEMPS_DE_TRAVAIL_PAR_DEFAUT.minutesParJour,
      jours: lireJoursTravailles(valeurs[REGLAGES.joursTravailles]) || [...TEMPS_DE_TRAVAIL_PAR_DEFAUT.jours],
      avecBase: String(valeurs[REGLAGES.base] || '').toLowerCase() !== NON,
      titresConges: lireTitresConges(valeurs[REGLAGES.titresConges]) || [...TEMPS_DE_TRAVAIL_PAR_DEFAUT.titresConges]
    }
  };
}

function depuisSheet(champ, valeur) {
  return MOTS_SHEET_PROJETS[champ][valeur] || valeur;
}

/**
 * Lignes de l'onglet Projects (à partir de la ligne 2) → [{ code, nom, type, statut, equipe, numeroLigne }].
 */
export function lireProjets(lignes) {
  return (lignes || [])
    .map((ligne, position) => {
      const cellule = (i) => String(ligne[i] ?? '').trim();
      const type = depuisSheet('type', cellule(2).toLowerCase());
      return {
        code: cellule(0),
        nom: cellule(1),
        type: TYPES_PROJET.includes(type) ? type : 'projet',
        statut: depuisSheet('statut', cellule(3).toLowerCase()),
        creeLe: /^\d{4}-\d{2}-\d{2}$/.test(cellule(4)) ? cellule(4) : '',
        equipe: cellule(5).toLowerCase() === OUI,
        numeroLigne: position + 2
      };
    })
    .filter((projet) => projet.code && projet.nom);
}

/**
 * Lignes de l'onglet Entries (à partir de la ligne 2) → saisies, avec leur numéro de ligne dans le Sheet.
 * Colonnes : Id, Date, Start, End, Minutes, Project code, Source, Event id, Title, Auto-assigned, Modified.
 */
export function lireSaisies(lignes) {
  return (lignes || []).map((ligne, position) => {
    const cellule = (i) => String(ligne[i] ?? '');
    return {
      id: cellule(0),
      date: cellule(1),
      debut: cellule(2),
      fin: cellule(3),
      minutes: Number(cellule(4)) || 0,
      code: cellule(5).trim(),
      source: cellule(6),
      idEvenement: cellule(7),
      titre: cellule(8),
      auto: cellule(9) === OUI,
      numeroLigne: position + 2   // ligne 1 = en-têtes
    };
  });
}

// Séparateurs entre le client et le sujet : "|" ou un tiret entouré d'espaces ; "x" entre deux parties.
const SEPARATEUR_SUJET = /\s*\|\s*|\s+[-–—]\s+/;
const SEPARATEUR_ENTRE = /\s+[x×]\s+/i;

function clientsDuTitre(titre) {
  const morceaux = String(titre ?? '').split(SEPARATEUR_SUJET);
  const parties = morceaux[0].split(SEPARATEUR_ENTRE);
  if (morceaux.length === 1 && parties.length === 1) return [];
  return parties.map((p) => p.trim()).filter(Boolean);
}

function commenceParMot(texte, mot) {
  if (!texte.startsWith(mot)) return false;
  const suivant = texte.charAt(mot.length);
  return suivant === '' || !/[a-z0-9]/.test(suivant);
}

/**
 * Pré-attribution : titre "CLIENT | sujet" → le seul projet actif dont le nom commence par CLIENT ; sinon null.
 */
export function preAttribuer(titre, projetsActifs) {
  const clients = clientsDuTitre(titre).map(normaliser).filter(Boolean);
  if (clients.length === 0) return null;
  const correspondances = projetsActifs.filter((projet) => {
    const nom = normaliser(projet.nom);
    return clients.some((client) => commenceParMot(nom, client));
  });
  return correspondances.length === 1 ? correspondances[0] : null;
}

/**
 * Lien d'un Google Sheet (…/spreadsheets/d/<id>/…) ou identifiant seul → identifiant ; sinon "".
 */
export function idSheetDepuisLien(texte) {
  const valeur = String(texte ?? '').trim();
  const dansLien = /\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/.exec(valeur);
  if (dansLien) return dansLien[1];
  return /^[A-Za-z0-9_-]{30,}$/.test(valeur) ? valeur : '';
}
