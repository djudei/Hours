// Projets : mêmes règles que Projets.gs (création, renommage, archivage, suppression d'un projet sans créneau).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categories, planCreation, planStatut, planRenommageProjet, planSuppressionProjet } from '../js/projets.js';

const projets = [
  { code: '2026-001', nom: 'Morel', type: 'projet', statut: 'actif', equipe: false, numeroLigne: 2 },
  { code: '0001', nom: 'Admin', type: 'interne', statut: 'actif', equipe: false, numeroLigne: 3 },
  { code: '2026-002', nom: 'Équipe', type: 'projet', statut: 'actif', equipe: true, numeroLigne: 4 },
  { code: '2026-003', nom: 'Vieux', type: 'projet', statut: 'archivé', equipe: false, numeroLigne: 5 }
];
const cats = categories({ nomCategorieProjet: '', nomCategorieAutre: '' });

test('catégories : projets (nom par défaut), 3e seulement si nommée, internes', () => {
  assert.deepEqual(cats.map((c) => [c.type, c.nom]), [['projet', 'Projets clients'], ['interne', 'Lignes internes']]);
  assert.deepEqual(categories({ nomCategorieProjet: 'Clients', nomCategorieAutre: 'Prospects' }).map((c) => c.nom),
    ['Clients', 'Prospects', 'Lignes internes']);
});

test('création : ligne anglaise du Sheet ; N° mal formé, déjà pris (archives comprises), nom vide, 3e catégorie sans nom → erreur', () => {
  assert.deepEqual(planCreation({ code: ' 2026-004 ', nom: ' Lumen ', type: 'projet', projets, categories: cats, aujourdhui: '2026-11-06' }),
    ['2026-004', 'Lumen', 'project', 'active', '2026-11-06']);
  assert.deepEqual(planCreation({ code: '0002', nom: 'Formation', type: 'interne', projets, categories: cats, aujourdhui: '2026-11-06' })[2], 'internal');
  assert.throws(() => planCreation({ code: '20 26', nom: 'x', type: 'projet', projets, categories: cats, aujourdhui: '' }));
  assert.throws(() => planCreation({ code: '2026-003', nom: 'x', type: 'projet', projets, categories: cats, aujourdhui: '' }));
  assert.throws(() => planCreation({ code: '2026-009', nom: '  ', type: 'projet', projets, categories: cats, aujourdhui: '' }));
  assert.throws(() => planCreation({ code: '2026-009', nom: 'x', type: 'autre', projets, categories: cats, aujourdhui: '' }));
});

test('archiver / réactiver et renommer : une seule cellule ; projet de l\'équipe ou introuvable → erreur', () => {
  assert.deepEqual(planStatut({ code: '2026-001', statut: 'archivé', projets }), { plage: 'Projects!D2', valeur: 'archived' });
  assert.deepEqual(planStatut({ code: '2026-003', statut: 'actif', projets }), { plage: 'Projects!D5', valeur: 'active' });
  assert.deepEqual(planRenommageProjet({ code: '0001', nom: ' Admin,  compta ', projets }), { plage: 'Projects!B3', valeur: 'Admin, compta' });
  assert.throws(() => planStatut({ code: '2026-002', statut: 'archivé', projets }));
  assert.throws(() => planRenommageProjet({ code: '9999', nom: 'x', projets }));
});

test('supprimer : seulement sans créneau attribué (sinon on propose d\'archiver)', () => {
  const saisies = [{ code: '2026-001' }, { code: '2026-001' }, { code: 'Break' }];
  assert.equal(planSuppressionProjet({ code: '2026-003', projets, saisies }), 5);
  assert.throws(() => planSuppressionProjet({ code: '2026-001', projets, saisies }), /2 créneaux/);
});
