// Règles reprises de l'appli Apps Script : lecture du Sheet (Settings, Projects, Entries) et pré-attribution.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  lireHeuresParJour, lireJoursTravailles, lireTitresConges, interpreterReglages,
  lireProjets, lireSaisies, preAttribuer, idSheetDepuisLien
} from '../js/regles.js';

test('heures par jour : formats acceptés, illisible → null', () => {
  assert.equal(lireHeuresParJour('7h00'), 420);
  assert.equal(lireHeuresParJour('7:30'), 450);
  assert.equal(lireHeuresParJour('7,5'), 450);
  assert.equal(lireHeuresParJour('beaucoup'), null);
  assert.equal(lireHeuresParJour('20'), null);
});

test('jours travaillés : « mon, tue » → [1, 2] ; nom inconnu → null', () => {
  assert.deepEqual(lireJoursTravailles('mon, tue, wed, thu, fri'), [1, 2, 3, 4, 5]);
  assert.deepEqual(lireJoursTravailles('sun, sat'), [6, 0]);
  assert.equal(lireJoursTravailles('lundi, xyz'), null);
});

test('titres de congés : sans doublons ni vides', () => {
  assert.deepEqual(lireTitresConges('Off, off ; RTT,,'), ['Off', 'RTT']);
});

test('réglages : lignes du Sheet → prénom et temps de travail ; valeur illisible → valeur par défaut', () => {
  const r = interpreterReglages([['Setting', 'Value'], ['First name', 'Julien'], ['Hours per day', '8h'],
    ['Working days', 'mon, tue, wed, thu'], ['Calculate baseline', 'no'], ['Tracking start', '2026-09-01']]);
  assert.equal(r.prenom, 'Julien');
  assert.equal(r.debutSuivi, '2026-09-01');
  assert.deepEqual(r.tempsDeTravail, { minutesParJour: 480, jours: [1, 2, 3, 4], avecBase: false,
    titresConges: ['Non travaillé', 'Off', 'Congés', 'Congé', 'RTT'] });
  const defaut = interpreterReglages([['Hours per day', '???']]);
  assert.equal(defaut.tempsDeTravail.minutesParJour, 420);
  assert.equal(defaut.tempsDeTravail.avecBase, true);
});

test('projets : mots anglais du Sheet → repères internes ; lignes incomplètes ignorées', () => {
  const projets = lireProjets([
    ['2026-001', 'Atelier Morel', 'project', 'active', '2026-01-04', 'yes'],
    ['0001', 'Admin', 'internal', 'archived'],
    ['', 'Sans numéro', 'project', 'active'],
    ['2026-002', 'Ancien Sheet', 'projet', 'actif']
  ]);
  assert.deepEqual(projets.map((p) => [p.code, p.type, p.statut, p.equipe]),
    [['2026-001', 'projet', 'actif', true], ['0001', 'interne', 'archivé', false], ['2026-002', 'projet', 'actif', false]]);
});

test('saisies : une ligne Entries → objet saisie', () => {
  const [s] = lireSaisies([['S1', '2026-11-06', '09:00', '09:30', '30', '0001', 'calendar', 'abc@google.com_1', 'Point', 'yes', '']]);
  assert.deepEqual(s, { id: 'S1', date: '2026-11-06', debut: '09:00', fin: '09:30', minutes: 30, code: '0001',
    source: 'calendar', idEvenement: 'abc@google.com_1', titre: 'Point', auto: true, numeroLigne: 2 });
});

test('pré-attribution : « CLIENT | sujet » → le seul projet actif qui commence par CLIENT', () => {
  const actifs = [{ code: '1', nom: 'Morel 2026' }, { code: '2', nom: 'Lumen' }, { code: '3', nom: 'Lumière' }];
  assert.equal(preAttribuer('MOREL | maquettes', actifs).code, '1');
  assert.equal(preAttribuer('Agence x Lumen - brief', actifs).code, '2');
  assert.equal(preAttribuer('Lum - point', actifs), null);   // « Lum » n'est pas un mot entier
  assert.equal(preAttribuer('Déjeuner', actifs), null);
});

test('lien du Google Sheet → identifiant ; texte quelconque → ""', () => {
  assert.equal(idSheetDepuisLien('https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit#gid=0'),
    '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789');
  assert.equal(idSheetDepuisLien('bonjour'), '');
});
