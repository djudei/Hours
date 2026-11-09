// « J'ai déjà un Sheet Hours » : la fenêtre Google de choix de fichier.
// Avec l'accès limité (drive.file), Hours ne voit que les fichiers qu'il a créés… ou que la personne choisit ici.
import { CLE_API_CHOIX, NUMERO_PROJET } from './config.js';
import { jetonActuel } from './google.js';
import { t } from './textes.js';

const SCRIPT_GOOGLE_API = 'https://apis.google.com/js/api.js';
let chargement = null;

export const choixFichierDisponible = () => Boolean(CLE_API_CHOIX);

function chargerModule() {
  if (window.google?.picker) return Promise.resolve();
  if (!chargement) {
    chargement = new Promise((resoudre, rejeter) => {
      const script = document.createElement('script');
      script.src = SCRIPT_GOOGLE_API;
      script.onload = () => window.gapi.load('picker', { callback: resoudre, onerror: () => rejeter(new Error(t('choix.erreur'))) });
      script.onerror = () => { chargement = null; rejeter(new Error(t('choix.erreur'))); };
      document.head.append(script);
    });
  }
  return chargement;
}

/**
 * Ouvre la fenêtre Google, limitée aux Google Sheets. Renvoie l'identifiant du Sheet choisi, ou '' si la personne ferme.
 */
export async function choisirSheet() {
  if (!choixFichierDisponible()) throw new Error(t('choix.indisponible'));
  const jeton = jetonActuel();
  if (!jeton) throw new Error(t('erreur.sessionExpiree'));
  await chargerModule();
  const { picker } = window.google;
  return new Promise((resoudre) => {
    const vue = new picker.DocsView(picker.ViewId.SPREADSHEETS).setMode(picker.DocsViewMode.LIST).setQuery('Hours');
    new picker.PickerBuilder()
      .addView(vue)
      .setOAuthToken(jeton)
      .setDeveloperKey(CLE_API_CHOIX)
      .setAppId(NUMERO_PROJET)
      .setTitle(t('choix.titre'))
      .setLocale('fr')
      .setCallback((donnees) => {
        if (donnees.action === picker.Action.PICKED) resoudre(donnees.docs?.[0]?.id || '');
        else if (donnees.action === picker.Action.CANCEL) resoudre('');
      })
      .build()
      .setVisible(true);
  });
}
