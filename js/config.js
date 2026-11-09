// Réglages techniques du site.
// CLIENT_ID : l'identifiant « client OAuth » créé dans Google Cloud (type « Application Web »).
// Ce n'est PAS un secret : Google le prévoit visible dans la page ; seules les adresses autorisées
// dans Google Cloud (localhost pendant les essais, puis l'adresse du site) peuvent l'utiliser.
export const CLIENT_ID = '1057698378742-6775bp3b7jhflvi2s1e4b6dh64e1i1ql.apps.googleusercontent.com';

// Accès demandés à la personne, au minimum :
// - lire son Agenda (jamais le modifier) ;
// - les seuls fichiers créés ou choisis depuis Hours (drive.file) : Hours ne voit aucun autre fichier de son Drive ;
// - l'email de son compte, pour ne pas lui redemander son compte à chaque retour.
export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

// Fenêtre Google de choix de fichier (« J'ai déjà un Sheet Hours »).
// CLE_API_CHOIX : une « clé API » Google Cloud, limitée à l'adresse du site. Comme l'identifiant client,
// elle est visible dans la page par nature : ce n'est pas un secret. Vide = option pas encore activée.
// NUMERO_PROJET : le numéro du projet Google Cloud « Hours » (début de l'identifiant client).
export const CLE_API_CHOIX = 'AIzaSyBYf8Wrxm1CYpj2TjLXghX4_8VfJ9aprss';
export const NUMERO_PROJET = CLIENT_ID.split('-')[0];

// Lien de l'appli actuelle (Apps Script), proposé pour les écrans pas encore refaits.
export const LIEN_APPLI_ACTUELLE =
  'https://script.google.com/macros/s/AKfycbzYsv6nnYUfs5JJk1HFBhTKbXFbp0Bu0oFDX1DL9KLo_RkGothm-WhHNORmjXAxwigbFA/exec';
