// Écran Réglages, façon Réglages de l'iPhone : groupes de lignes, interrupteur, jours en pastilles.
// Les valeurs restent dans les champs jusqu'à « Enregistrer les réglages » (un seul enregistrement, tout vérifié).
import { h } from './dom.js';
import { t, calendrier } from './textes.js';
import { ecrireHeuresParJour, ORDRE_JOURS } from './reglages-edition.js';
import { lireIntitulesCharge, INTITULES_PAR_DEFAUT } from './charge.js';
import { proposerNumero, FORMATS_NUMERO } from './numerotation.js';
import { LIEN_APPLI_ACTUELLE } from './config.js';

const INTITULES_CASES = 5;
const enDateFr = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

/**
 * vue : { enCours, erreur } ; actions : { enregistrer(saisie), ouvrirSheet(), changerSheet(), deconnecter() }
 */
export function ecranReglages(reglagesSheet, vue, actions, { demo }) {
  // Pendant un aperçu de renumérotation (ou après une erreur), le formulaire garde ce qui a été tapé.
  const reglages = vue.saisie ? depuisSaisie(reglagesSheet, vue.saisie) : reglagesSheet;
  const champ = (id, valeur, attributs = {}) => h('input', { id, type: 'text', value: valeur ?? '', ...attributs });
  const prenom = champ('reglage-prenom', reglages.prenom, { maxlength: 60, autocomplete: 'given-name' });
  const debut = champ('reglage-debut', enDateFr(reglages.debutSuivi), { placeholder: 'jj/mm/aaaa', inputmode: 'numeric' });
  const heures = champ('reglage-heures', ecrireHeuresParJour(reglages.tempsDeTravail.minutesParJour), { inputmode: 'decimal' });
  const conges = h('textarea', { id: 'reglage-conges', rows: 2 });
  conges.value = reglages.tempsDeTravail.titresConges.join(', ');
  const base = h('input', { id: 'reglage-base', type: 'checkbox', role: 'switch', class: 'interrupteur', checked: reglages.tempsDeTravail.avecBase });
  const categorieProjet = champ('reglage-cat-projet', reglages.nomCategorieProjet || t('categorie.projet'), { maxlength: 30 });
  const categorieAutre = champ('reglage-cat-autre', reglages.nomCategorieAutre, { maxlength: 30 });
  const intitules = [...(lireIntitulesCharge(reglages.intitulesChargeTexte) || INTITULES_PAR_DEFAUT), '', '', '', '', ''].slice(0, INTITULES_CASES);
  const champsIntitules = intitules.map((valeur, i) => champ(`reglage-zone-${i}`, valeur, { maxlength: 40, 'aria-label': t('reglages.intitule', { numero: i + 1 }) }));
  const jours = ORDRE_JOURS.map((jour) => h('button', {
    type: 'button', class: `jour-pastille${reglages.tempsDeTravail.jours.includes(jour) ? ' actif' : ''}`,
    'aria-pressed': String(reglages.tempsDeTravail.jours.includes(jour)), 'aria-label': calendrier.NOMS_JOURS[jour], 'data-jour': jour,
    onclick: (e) => {
      const bouton = e.currentTarget;
      const actif = bouton.getAttribute('aria-pressed') !== 'true';
      bouton.setAttribute('aria-pressed', String(actif));
      bouton.classList.toggle('actif', actif);
    }
  }, calendrier.JOURS_COURTS[jour]));

  const enregistrer = (evenement) => {
    evenement.preventDefault();
    actions.enregistrer({
      prenom: prenom.value,
      formatNumero: format.value,
      debutSuivi: debut.value,
      nomCategorieProjet: categorieProjet.value,
      nomCategorieAutre: categorieAutre.value,
      intitulesCharge: champsIntitules.map((c) => c.value),
      tempsDeTravail: {
        heuresParJour: heures.value, avecBase: base.checked, titresConges: conges.value,
        jours: jours.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => Number(b.dataset.jour))
      }
    });
  };
  const ligne = (id, libelle, element) => h('label', { class: 'champ-ligne', for: id }, h('span', {}, libelle), element);
  const groupe = (titre, ...contenu) => [h('div', { class: 'entete-section' }, h('h2', {}, titre)), h('div', { class: 'carte liste formulaire-manuel groupe-reglages' }, ...contenu)];
  const aide = (texte) => h('p', { class: 'note note-reglages' }, texte);
  const equipe = reglages.equipe?.role;
  const exemple = (format) => {
    try { return proposerNumero({ format, codes: [], periode: { annee: new Date().getFullYear(), mois: new Date().getMonth() + 1 }, lettres: 'ACME', type: 'projet' }); } catch { return format; }
  };
  const format = h('select', { id: 'reglage-format' }, FORMATS_NUMERO.map((f) => h('option', { value: f, selected: f === reglages.formatNumero },
    `${exemple(f)} · ${t(`numero.format.${f}`)}`)));

  return h('section', { class: 'ecran', 'aria-labelledby': 'titre-reglages' },
    h('div', { class: 'barre-outils' }),
    h('header', { class: 'grand-titre' }, h('h1', { id: 'titre-reglages' }, t('reglages.titre'))),
    vue.bienvenue ? h('p', { class: 'note bienvenue' }, t('reglages.bienvenue')) : null,
    h('form', { class: 'formulaire-reglages', onsubmit: enregistrer },
      groupe(t('reglages.toi'), ligne('reglage-prenom', t('reglages.prenom'), prenom), ligne('reglage-debut', t('reglages.debutSuivi'), debut)),
      aide(`${t('reglages.prenom.aide')} ${t('reglages.debutSuivi.aide')}`),
      groupe(t('reglages.temps'),
        ligne('reglage-base', t('reglages.base'), base),
        ligne('reglage-heures', t('reglages.heuresParJour'), heures),
        h('div', { class: 'champ-colonne' }, h('span', {}, t('reglages.jours')), h('div', { class: 'jours-pastilles', role: 'group', 'aria-label': t('reglages.jours') }, jours)),
        h('label', { class: 'champ-colonne', for: 'reglage-conges' }, h('span', {}, t('reglages.conges')), conges)),
      aide(t('reglages.conges.aide')),
      groupe(t('reglages.mots'),
        ligne('reglage-cat-projet', t('reglages.categorieProjet'), categorieProjet),
        ligne('reglage-cat-autre', t('reglages.categorieAutre'), categorieAutre),
        ligne('reglage-format', t('reglages.format'), format)),
      aide(`${t('reglages.categorieAutre.aide')} ${t('reglages.format.aide')}`),
      groupe(t('reglages.intitules'), champsIntitules.map((c, i) => ligne(`reglage-zone-${i}`, t('reglages.intitule', { numero: i + 1 }), c))),
      vue.erreur ? h('p', { class: 'note erreur', role: 'alert' }, vue.erreur) : null,
      vue.apercu ? apercuRenumerotation(vue.apercu, actions) : null,
      h('button', { class: 'bouton-principal bouton-large', type: 'submit', disabled: vue.enCours }, t('reglages.enregistrer'))),
    ...groupe(t('reglages.equipe'),
      h('div', { class: 'champ-ligne' }, h('span', {}, equipe === 'manager' ? t('reglages.equipe.responsable') : equipe === 'member' ? t('reglages.equipe.membre') : t('reglages.equipe.aucune')))),
    aide(t('reglages.equipe.aide')),
    ...groupe(t('reglages.sheet'),
      demo ? null : h('button', { class: 'ligne ligne-bouton lien-ligne', type: 'button', onclick: actions.ouvrirSheet }, t('reglages.ouvrirSheet')),
      demo ? null : h('button', { class: 'ligne ligne-bouton lien-ligne', type: 'button', onclick: actions.changerSheet }, t('reglages.changerSheet')),
      h('a', { class: 'ligne ligne-bouton lien-ligne', href: LIEN_APPLI_ACTUELLE, target: '_blank', rel: 'noopener' }, t('reglages.appliActuelle')),
      demo ? null : h('button', { class: 'ligne ligne-bouton lien-ligne bouton-danger', type: 'button', onclick: actions.deconnecter }, t('reglages.deconnecter'))));
}

// Aperçu « ancien N° → nouveau N° » avant de renuméroter : rien ne change sans ce 2e appui.
function apercuRenumerotation(changements, actions) {
  return h('div', { class: 'carte apercu-renum', role: 'alert' },
    h('h3', {}, t('reglages.renum.titre')),
    h('p', { class: 'secondaire' }, t('reglages.renum.texte', { nombre: changements.length })),
    h('ul', { class: 'liste-renum' }, changements.map((c) => h('li', {},
      h('span', { class: 'renum-ancien' }, c.ancien), ' → ', h('strong', {}, c.nouveau), h('span', { class: 'secondaire' }, ` · ${c.nom}`)))),
    h('button', { class: 'bouton-principal', type: 'button', onclick: actions.renumeroter }, t('reglages.renum.confirmer')),
    h('button', { class: 'bouton-texte', type: 'button', onclick: actions.annulerRenumerotation }, t('reglages.renum.annuler')));
}

// Valeurs tapées (texte) → même forme que les réglages lus dans le Sheet, pour reremplir le formulaire.
function depuisSaisie(reglages, saisie) {
  const minutes = /^(\d{1,2})h(\d{2})?$/.exec(String(saisie.tempsDeTravail.heuresParJour).trim());
  return {
    ...reglages,
    prenom: saisie.prenom,
    debutSuivi: /^\d{2}\/\d{2}\/\d{4}$/.test(saisie.debutSuivi) ? saisie.debutSuivi.split('/').reverse().join('-') : '',
    formatNumero: saisie.formatNumero,
    nomCategorieProjet: saisie.nomCategorieProjet,
    nomCategorieAutre: saisie.nomCategorieAutre,
    intitulesChargeTexte: saisie.intitulesCharge.filter(Boolean).join(' | '),
    tempsDeTravail: {
      ...reglages.tempsDeTravail,
      minutesParJour: minutes ? Number(minutes[1]) * 60 + Number(minutes[2] || 0) : reglages.tempsDeTravail.minutesParJour,
      jours: saisie.tempsDeTravail.jours,
      avecBase: saisie.tempsDeTravail.avecBase,
      titresConges: String(saisie.tempsDeTravail.titresConges).split(',').map((x) => x.trim()).filter(Boolean)
    }
  };
}
