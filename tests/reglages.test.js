// Réglages : mêmes contrôles et même onglet Settings que Reglages.gs ; intitulés de la ToDo renommés = la ligne suit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifierReglages, planReglages, renommagesIntitules, appliquerRenommages, ecrireHeuresParJour, ecrireJoursTravailles } from '../js/reglages-edition.js';

const saisie = {
  prenom: '  Julien ', debutSuivi: '01/09/2026', nomCategorieProjet: '', nomCategorieAutre: '',
  tempsDeTravail: { heuresParJour: '7h30', jours: [5, 1, 2], avecBase: true, titresConges: 'Off, RTT' },
  intitulesCharge: ['Interne', 'Projets en cours', '', '', '']
};

test('écriture des valeurs : 450 → « 7h30 », [1, 2] → « mon, tue »', () => {
  assert.equal(ecrireHeuresParJour(450), '7h30');
  assert.equal(ecrireHeuresParJour(420), '7h00');
  assert.equal(ecrireJoursTravailles([5, 1, 2]), 'mon, tue, fri');
});

test('vérification : valeurs nettoyées ; prénom vide, heures illisibles, aucun jour, catégories identiques → erreur', () => {
  const p = verifierReglages(saisie);
  assert.equal(p.prenom, 'Julien');
  assert.equal(p.debutSuivi, '2026-09-01');
  assert.deepEqual(p.tempsDeTravail, { minutesParJour: 450, jours: [1, 2, 5], avecBase: true, titresConges: ['Off', 'RTT'] });
  assert.equal(p.nomCategorieProjet, 'Projets clients');
  assert.deepEqual(p.intitulesCharge, ['Interne', 'Projets en cours']);
  assert.throws(() => verifierReglages({ ...saisie, prenom: ' ' }));
  assert.throws(() => verifierReglages({ ...saisie, tempsDeTravail: { ...saisie.tempsDeTravail, heuresParJour: 'beaucoup' } }));
  assert.throws(() => verifierReglages({ ...saisie, tempsDeTravail: { ...saisie.tempsDeTravail, jours: [] } }));
  assert.throws(() => verifierReglages({ ...saisie, nomCategorieProjet: 'Lignes internes' }));
  assert.throws(() => verifierReglages({ ...saisie, intitulesCharge: ['A', 'a', '', '', ''] }));
  assert.throws(() => verifierReglages({ ...saisie, debutSuivi: '32/13/2026' }));
});

test('onglet Settings : chaque valeur sur la ligne de son libellé (texte brut), libellés manquants ajoutés en bas', () => {
  const lignes = [['Setting', 'Value'], ['First name', 'Jules'], ['Hours per day', '7h00'], ['Working days', 'mon']];
  const plan = planReglages(lignes, verifierReglages(saisie));
  assert.deepEqual(plan.modifications.find((m) => m.plage === 'Settings!B2'), { plage: 'Settings!B2', valeurs: [['Julien']] });
  assert.deepEqual(plan.modifications.find((m) => m.plage === 'Settings!B3').valeurs, [['7h30']]);
  assert.deepEqual(plan.ajouts.find((a) => a[0] === 'Workload titles'), ['Workload titles', 'Interne | Projets en cours']);
  assert.deepEqual(plan.ajouts.find((a) => a[0] === 'Calculate baseline'), ['Calculate baseline', 'yes']);
});

test('intitulés de la ToDo renommés : même case, autre texte → la ligne suit (missions gardées)', () => {
  const renommages = renommagesIntitules(['Interne', 'En cours', 'À venir'], ['Interne', 'Projets actifs', 'À venir']);
  assert.deepEqual(renommages, { 'En cours': 'Projets actifs' });
  const tableau = { mois: { '2026-11': { 'En cours': 'ALPHA' } }, modifie: {}, intitules: ['Interne', 'En cours', 'À venir'] };
  const nouveau = appliquerRenommages(tableau, renommages);
  assert.deepEqual(nouveau.intitules, ['Interne', 'Projets actifs', 'À venir']);
  assert.equal(nouveau.mois['2026-11']['Projets actifs'], 'ALPHA');
  // Nouveau nom déjà utilisé par une ligne avec des missions : on n'écrit pas, on signale.
  const occupe = { ...tableau, mois: { '2026-11': { 'En cours': 'A', 'À venir': 'B' } } };
  assert.throws(() => appliquerRenommages(occupe, { 'En cours': 'À venir' }));
});
