// Sheet d'un nouveau venu : même structure que Classeur.gs (onglets, en-têtes, réglages par défaut) ;
// Sheet existant relié par son lien : on vérifie que c'est bien un Sheet Hours avant de s'en servir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nouveauClasseur, problemeStructure } from '../js/classeur.js';

test('nouveau Sheet : « Hours », 3 onglets, en-têtes, réglages par défaut, suivi au 1er du mois', () => {
  const c = nouveauClasseur({ aujourdhui: '2026-11-06', fuseau: 'Europe/Paris' });
  assert.equal(c.properties.title, 'Hours');
  assert.equal(c.properties.timeZone, 'Europe/Paris');
  assert.deepEqual(c.sheets.map((s) => s.properties.title), ['Projects', 'Entries', 'Settings']);
  const valeurs = (titre) => c.sheets.find((s) => s.properties.title === titre).data[0].rowData
    .map((ligne) => ligne.values.map((v) => v.userEnteredValue?.stringValue ?? ''));
  assert.deepEqual(valeurs('Projects')[0], ['Code', 'Name', 'Type', 'Status']);
  assert.deepEqual(valeurs('Entries')[0], ['Id', 'Date', 'Start', 'End', 'Minutes', 'Project code', 'Source', 'Event id', 'Title', 'Auto-assigned', 'Modified']);
  const reglages = Object.fromEntries(valeurs('Settings').slice(1));
  assert.equal(reglages['Tracking start'], '2026-11-01');
  assert.equal(reglages['Hours per day'], '7h00');
  assert.equal(reglages['Working days'], 'mon, tue, wed, thu, fri');
  assert.equal(reglages['Project number format'], 'YYYY-001');
  assert.equal(reglages['Sheet version'], '2');
  // Codes, dates et heures gardés en texte (Sheets ne les transforme pas).
  const entries = c.sheets.find((s) => s.properties.title === 'Entries');
  assert.equal(entries.properties.gridProperties.frozenRowCount, 1);
});

test('Sheet relié : onglet absent ou autres en-têtes → message ; Sheet Hours → rien à signaler', () => {
  assert.equal(problemeStructure({ Projects: ['Code', 'Name', 'Type', 'Status'], Entries: ['Id', 'Date', 'Start', 'End', 'Minutes', 'Project code', 'Source', 'Event id', 'Title', 'Auto-assigned', 'Modified'] }), '');
  assert.match(problemeStructure({ Projects: null, Entries: [] }), /Projects/);
  assert.match(problemeStructure({ Projects: ['Code', 'Name', 'Type', 'Status'], Entries: ['Id', 'Date'] }), /Entries/);
});
