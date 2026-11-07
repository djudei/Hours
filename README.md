# Hours

**Hours transforme ton Google Agenda en feuille de temps.** L'appli lit tes réunions, t'aide à attribuer chaque créneau à un projet, calcule ton temps passé et l'écrit dans **ton propre Google Sheet**.

Gratuit, sans serveur, sans compte à créer : tes données restent dans ton Google Agenda et ton Google Sheet.

👉 **Essayer l'appli : https://djudei.github.io/Hours/**
👉 **Voir la démo avec des données inventées : https://djudei.github.io/Hours/?demo**

## Pour qui

- **Un indépendant** qui veut savoir combien de temps il passe sur chaque client ou projet.
- Bientôt, **une petite équipe** qui veut rassembler les temps de chacun.

## Ce que fait Hours

- **Agenda** : ta semaine en grille horaire. Touche une réunion pour l'attribuer à un projet, la marquer en congé, en pause ou l'ignorer. Les titres du type `CLIENT | sujet` sont attribués automatiquement quand il n'y a aucun doute. Tu peux ajouter un créneau à la main.
- **ToDo** : tes missions du mois, rangées par zones (projets en cours, à venir, développement commercial…).
- **Projets** : numérotés automatiquement selon le format de ton choix (`2026-001`, `ACME-001`…).
- **Récap** : temps travaillé par projet et par mois. Si tu le veux, l'écart avec tes heures attendues. Un bouton met à jour ton Google Sheet (un onglet par mois et un récap annuel).
- **Réglages** : heures par jour, jours travaillés, titres de congés, noms des catégories, format des numéros.

**Règle de conception : dans le doute, Hours n'écrit pas, il signale.** Pas de projet deviné, pas d'écrasement silencieux.

## Tes données

- Hours fonctionne **entièrement dans ton navigateur**. Il parle directement à Google, sans aucun serveur intermédiaire.
- Accès demandés : **lecture de ton Agenda** (Hours ne le modifie jamais) et **Google Sheets** (pour écrire dans ton Sheet).
- La connexion Google reste en mémoire le temps de la session. **Elle n'est jamais enregistrée.**
- L'appli n'est pas encore vérifiée par Google. Au moment de la connexion, Google affiche donc un avertissement « application non validée ».

## Pour les curieux du code

- HTML, CSS et JavaScript, **sans outil de construction** : les fichiers sont servis tels quels par GitHub Pages.
- Code et commentaires en français.
- Tests : `npm test` (Node 20 ou plus récent).
- Pour l'essayer chez toi, sers le dossier avec n'importe quel petit serveur web local, puis ouvre `index.html?demo`.

L'identifiant client OAuth présent dans `js/config.js` n'est pas un secret. Google le prévoit visible dans la page, et seules les adresses autorisées peuvent s'en servir.

## Licence

[MIT](LICENSE) : tu peux reprendre, modifier et redistribuer ce code, à condition de garder la mention de licence.
