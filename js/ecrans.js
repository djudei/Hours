// Petits écrans : connexion, choix du Sheet, chargement, erreur, « bientôt ici ».
import { h, icone, TRACES } from './dom.js';
import { t } from './textes.js';
import { LIEN_APPLI_ACTUELLE } from './config.js';

export function ecranConnexion({ configure, onConnecter, onAutreCompte, enCours, compte, erreur }) {
  const bouton = compte ? t('connexion.continuer', { compte }) : t('connexion.bouton');
  return h('section', { class: 'ecran ecran-centre' },
    h('div', { class: 'logo', 'aria-hidden': 'true' }, 'H'),
    h('h1', {}, compte ? t('connexion.retour.titre') : t('connexion.titre')),
    h('p', { class: 'secondaire' }, compte ? t('connexion.retour.texte') : t('connexion.texte')),
    erreur ? h('p', { class: 'erreur', role: 'alert' }, erreur) : null,
    configure
      ? h('button', { class: 'bouton-principal', onclick: onConnecter, disabled: enCours }, enCours ? t('connexion.encours') : bouton)
      : h('p', { class: 'note signal' }, t('config.manquante')),
    compte && configure ? h('button', { class: 'bouton-texte', onclick: onAutreCompte, disabled: enCours }, t('connexion.autreCompte')) : null,
    compte ? null : h('a', { class: 'lien', href: '?demo' }, t('connexion.demo')));
}

const dateCourte = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '');

export function ecranSheet({ onCreer, onPrendre, onChoisirExistant, erreur, enCours, choix = [] }) {
  const plusieurs = choix.length > 0;
  return h('section', { class: 'ecran ecran-centre' },
    h('div', { class: 'logo', 'aria-hidden': 'true' }, 'H'),
    h('h1', {}, plusieurs ? t('sheet.choix.titre') : t('sheet.titre')),
    h('p', { class: 'secondaire' }, plusieurs ? t('sheet.choix.texte') : t('sheet.creer.texte')),
    erreur ? h('p', { class: 'erreur', role: 'alert' }, erreur) : null,
    plusieurs
      ? h('div', { class: 'liste-sheets' }, choix.map((sheet) => h('button', {
        class: 'ligne ligne-bouton choix-sheet', onclick: () => onPrendre(sheet.id), disabled: enCours
      }, h('span', {}, sheet.nom), sheet.modifie ? h('span', { class: 'secondaire' }, t('sheet.choix.modifie', { date: dateCourte(sheet.modifie) })) : null)))
      : null,
    h('button', { class: plusieurs ? 'bouton-texte' : 'bouton-principal', onclick: onCreer, disabled: enCours },
      enCours ? t('sheet.creer.encours') : t('sheet.creer')),
    h('button', { class: 'bouton-texte', onclick: onChoisirExistant, disabled: enCours }, t('sheet.dejaUn')));
}

export function ecranChargement(texte = t('semaine.chargement')) {
  return h('section', { class: 'ecran ecran-centre', 'aria-busy': 'true' },
    h('div', { class: 'roue', 'aria-hidden': 'true' }),
    h('p', { class: 'secondaire' }, texte));
}

/**
 * Connexion expirée pendant une action : l'action attend ; « Continuer » la relance, « Annuler » l'arrête sans rien écrire.
 */
export function feuilleReprise({ enCours, erreur }, { continuer, annuler }) {
  return h('div', { class: 'voile voile-reprise' },
    h('div', { class: 'feuille feuille-reprise', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'reprise-titre' },
      h('h2', { id: 'reprise-titre' }, t('reprise.titre')),
      h('p', { class: 'secondaire' }, t('reprise.texte')),
      erreur ? h('p', { class: 'erreur', role: 'alert' }, erreur) : null,
      h('button', { class: 'bouton-principal bouton-large', onclick: continuer, disabled: enCours }, enCours ? t('reprise.encours') : t('reprise.bouton')),
      h('button', { class: 'bouton-texte', onclick: annuler, disabled: enCours }, t('reprise.annuler'))));
}

export function ecranErreur({ message, onReessayer, onChangerSheet }) {
  return h('section', { class: 'ecran ecran-centre' },
    h('h1', {}, t('erreur.titre')),
    h('p', { class: 'erreur', role: 'alert' }, message),
    h('button', { class: 'bouton-principal', onclick: onReessayer }, t('erreur.reessayer')),
    onChangerSheet ? h('button', { class: 'bouton-texte', onclick: onChangerSheet }, t('sheet.changer')) : null);
}

export function ecranBientot(onglet) {
  return h('section', { class: 'ecran ecran-centre' },
    h('div', { class: 'logo logo-gris', 'aria-hidden': 'true' }, icone(TRACES[onglet], 30, 1.8)),
    h('h1', {}, t('bientot.titre')),
    h('p', { class: 'secondaire' }, t('bientot.texte')),
    h('a', { class: 'bouton-principal', href: LIEN_APPLI_ACTUELLE, target: '_blank', rel: 'noopener' }, t('bientot.lien')));
}

/**
 * Barre d'onglets du bas : 5 onglets, l'actif en couleur.
 */
export function barreOnglets(actif, onChoisir) {
  const onglets = ['agenda', 'charge', 'projets', 'recap', 'reglages'];
  return h('nav', { class: 'barre-onglets', 'aria-label': t('appli.nom') },
    onglets.map((onglet) => h('button', {
      class: `onglet${onglet === actif ? ' actif' : ''}`,
      'aria-current': onglet === actif ? 'page' : null,
      onclick: () => onChoisir(onglet)
    }, icone(TRACES[onglet], 26, 1.8), t(`onglet.${onglet}`))));
}
