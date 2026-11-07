// Réglages techniques du site.
// CLIENT_ID : l'identifiant « client OAuth » créé dans Google Cloud (type « Application Web »).
// Ce n'est PAS un secret : Google le prévoit visible dans la page ; seules les adresses autorisées
// dans Google Cloud (localhost pendant les essais, puis l'adresse du site) peuvent l'utiliser.
export const CLIENT_ID = '1057698378742-6775bp3b7jhflvi2s1e4b6dh64e1i1ql.apps.googleusercontent.com';

// Accès demandés à la personne, au minimum : lire son Agenda, lire et écrire dans ses Google Sheets.
export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/spreadsheets'
].join(' ');

// Lien de l'appli actuelle (Apps Script), proposé pour les écrans pas encore refaits.
export const LIEN_APPLI_ACTUELLE =
  'https://script.google.com/macros/s/AKfycbzYsv6nnYUfs5JJk1HFBhTKbXFbp0Bu0oFDX1DL9KLo_RkGothm-WhHNORmjXAxwigbFA/exec';
