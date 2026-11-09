// Connexion Google et appels aux API, depuis le navigateur de la personne.
// Le jeton d'accès reste en mémoire (jamais enregistré) ; Google le donne pour une heure environ.
// Seul l'email du compte est retenu dans le navigateur : il évite de redemander le compte à chaque retour.
//
// Quand le jeton expire pendant une action, l'action n'échoue pas : elle se met en pause,
// l'appli affiche « Continuer » (un appui = la fenêtre Google s'ouvre et se referme), puis l'action reprend.
import { CLIENT_ID, SCOPES } from './config.js';
import { t } from './textes.js';

const MARGE_EXPIRATION_MS = 60000;
const ATTENTE_SCRIPT_MS = 10000;
const CLE_COMPTE = 'hours.compte';
const API_COMPTE = 'https://www.googleapis.com/oauth2/v3/userinfo';

let jeton = null;
let expireA = 0;
let client = null;
let enAttente = null;
let email = lireCompteMemorise();

// Reprise après expiration : une seule attente partagée par toutes les actions en pause.
let reprise = null;
let surReprise = () => {};

function lireCompteMemorise() {
  try { return localStorage.getItem(CLE_COMPTE) || ''; } catch { return ''; }
}
function memoriserCompte(valeur) {
  try { valeur ? localStorage.setItem(CLE_COMPTE, valeur) : localStorage.removeItem(CLE_COMPTE); } catch { /* navigation privée */ }
}

function attendreScriptGoogle() {
  return new Promise((resoudre, rejeter) => {
    const debut = Date.now();
    const verifier = () => {
      if (window.google?.accounts?.oauth2) return resoudre();
      if (Date.now() - debut > ATTENTE_SCRIPT_MS) return rejeter(new Error(t('erreur.scriptGoogle')));
      setTimeout(verifier, 100);
    };
    verifier();
  });
}

function creerClient() {
  client = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (reponse) => {
      const attente = enAttente;
      enAttente = null;
      if (!attente) return;
      if (reponse.error) {
        attente.rejeter(new Error(t('erreur.connexion', { detail: reponse.error_description || reponse.error })));
        return;
      }
      if (!window.google.accounts.oauth2.hasGrantedAllScopes(reponse, ...SCOPES.split(' '))) {
        attente.rejeter(new Error(t('erreur.accesIncomplets')));
        return;
      }
      jeton = reponse.access_token;
      expireA = Date.now() + Number(reponse.expires_in || 0) * 1000;
      attente.resoudre(jeton);
    },
    error_callback: (erreur) => {
      const attente = enAttente;
      enAttente = null;
      attente?.rejeter(new Error(t('erreur.connexion', { detail: erreur?.type || '' })));
    }
  });
}

// La fenêtre Google doit s'ouvrir dans le prolongement direct de l'appui : si le module Google est déjà là,
// on la demande sans rien attendre avant (sinon Safari peut la bloquer).
function demanderJeton(options) {
  if (!client) creerClient();
  return new Promise((resoudre, rejeter) => {
    enAttente = { resoudre, rejeter };
    client.requestAccessToken(options);
  });
}

/**
 * Demande un jeton à Google. À appeler depuis un appui : sinon le navigateur bloque la fenêtre.
 * - par défaut : le compte retenu est proposé d'office (la fenêtre s'ouvre et se referme seule) ;
 * - autreCompte : Google laisse choisir le compte.
 */
export async function connecter({ autreCompte = false } = {}) {
  if (!window.google?.accounts?.oauth2) await attendreScriptGoogle();
  const options = autreCompte || !email ? { prompt: 'select_account' } : { prompt: '', login_hint: email };
  await demanderJeton(options);
  const compte = await lireCompte();
  if (compte) {
    email = compte;
    memoriserCompte(compte);
  }
  return email;
}

async function lireCompte() {
  try {
    const reponse = await fetch(API_COMPTE, { headers: { Authorization: `Bearer ${jeton}` } });
    return reponse.ok ? (await reponse.json()).email || '' : '';
  } catch {
    return '';
  }
}

export function estConnecte() {
  return Boolean(jeton) && Date.now() < expireA - MARGE_EXPIRATION_MS;
}

/** Email du compte Google connecté (ou retenu de la dernière visite), '' si aucun. */
export function compteGoogle() {
  return email;
}

/** Jeton en cours, pour la fenêtre Google de choix de fichier. */
export function jetonActuel() {
  return estConnecte() ? jeton : '';
}

/** Déconnexion : le jeton est révoqué et le compte retenu est oublié. */
export function deconnecter() {
  if (jeton) window.google?.accounts?.oauth2?.revoke(jeton, () => {});
  jeton = null;
  expireA = 0;
  email = '';
  memoriserCompte('');
}

// ---------- Reprise après expiration ----------

/** L'appli s'abonne ici : surReprise(true) = afficher « Continuer », surReprise(false) = le retirer. */
export function quandRepriseDemandee(fonction) {
  surReprise = fonction;
}

function attendreReprise() {
  if (!reprise) {
    let resoudre;
    let rejeter;
    const promesse = new Promise((ok, ko) => { resoudre = ok; rejeter = ko; });
    reprise = { promesse, resoudre, rejeter };
    surReprise(true);
  }
  return reprise.promesse;
}

/** Appui sur « Continuer » : nouveau jeton, puis les actions en pause repartent. En cas d'échec, « Continuer » reste. */
export async function reprendre() {
  await connecter();
  const enCours = reprise;
  reprise = null;
  surReprise(false);
  enCours?.resoudre();
}

/** Appui sur « Annuler » : les actions en pause s'arrêtent, sans rien écrire. */
export function abandonnerReprise() {
  const enCours = reprise;
  reprise = null;
  surReprise(false);
  enCours?.rejeter(erreurStatut(t('erreur.sessionExpiree'), 401));
}

// ---------- Appels aux API ----------

/**
 * GET sur une API Google ; renvoie le JSON.
 */
export function lireGoogle(url) {
  return appelGoogle(url);
}

/**
 * Envoi (POST, PUT) d'un contenu JSON à une API Google ; renvoie le JSON.
 */
export function ecrireGoogle(url, methode, contenu) {
  return appelGoogle(url, { method: methode, body: JSON.stringify(contenu) });
}

function erreurStatut(message, statut) {
  const erreur = new Error(message);
  erreur.statut = statut;
  return erreur;
}

/**
 * Appel d'une API Google avec le jeton de la personne. Erreurs traduites en phrases compréhensibles ;
 * l'erreur garde le code de Google (erreur.statut) pour que l'appli sache réagir (ex. Sheet inaccessible).
 */
async function appelGoogle(url, options = {}, dejaRepris = false) {
  if (!estConnecte()) await attendreReprise();
  const entetes = { Authorization: `Bearer ${jeton}` };
  if (options.body) entetes['Content-Type'] = 'application/json';
  const reponse = await fetch(url, { ...options, headers: entetes });
  if (reponse.ok) return reponse.json();
  if (reponse.status === 401 && !dejaRepris) {
    jeton = null;
    return appelGoogle(url, options, true);
  }
  let detail = '';
  try {
    detail = (await reponse.json())?.error?.message || '';
  } catch {
    detail = reponse.statusText;
  }
  if (reponse.status === 401) throw erreurStatut(t('erreur.sessionExpiree'), 401);
  if (reponse.status === 403) throw erreurStatut(t('erreur.acces'), 403);
  if (reponse.status === 404) throw erreurStatut(t('erreur.introuvable'), 404);
  throw erreurStatut(t('erreur.google', { detail }), reponse.status);
}
