// Changement de format des N° : même plan que Renumerotation.gs (ordre chronologique, N° de l'équipe réservés).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planRenumerotation, premieresSaisiesParCode, colonneRenumerotee } from '../js/renumerotation.js';

const projets = [
  { code: '1', nom: 'Morel refonte', type: 'projet', creeLe: '2026-03-02', numeroLigne: 2 },
  { code: '2', nom: 'Lumen', type: 'projet', creeLe: '', numeroLigne: 3 },
  { code: '3', nom: 'Admin', type: 'interne', creeLe: '2026-01-10', numeroLigne: 4 }
];

test('plan : nouveaux N° dans l\'ordre chronologique (créé le, sinon 1er créneau, sinon aujourd\'hui)', () => {
  const plan = planRenumerotation('YYYY-001', projets, { 2: '2026-02-15' }, '2026-11-06', []);
  assert.deepEqual(plan.map((p) => [p.ancien, p.nouveau, p.creeLe]), [
    ['1', '2026-003', '2026-03-02'], ['2', '2026-002', '2026-02-15'], ['3', '2026-001', '2026-01-10']]);
});

test('plan : N° réservés (projets de l\'équipe) jamais réattribués ; format client tiré du nom', () => {
  const plan = planRenumerotation('YYYY-001', projets.slice(0, 1), {}, '2026-11-06', ['2026-001']);
  assert.equal(plan[0].nouveau, '2026-002');
  assert.equal(planRenumerotation('CLIENT-001', projets.slice(0, 1), {}, '2026-11-06', [])[0].nouveau, 'MOREL-001');
});

test('premier créneau par N° ; colonne des codes réécrite (codes inconnus et choix spéciaux gardés)', () => {
  assert.deepEqual(premieresSaisiesParCode([{ code: '2', date: '2026-04-01' }, { code: '2', date: '2026-03-01' }, { code: '', date: '2026-01-01' }]), { 2: '2026-03-01' });
  assert.deepEqual(colonneRenumerotee([{ code: '1' }, { code: 'Break' }, { code: '9' }], { 1: '2026-003' }), [['2026-003'], ['Break'], ['9']]);
});
