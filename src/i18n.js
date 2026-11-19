const STRINGS = {
  en: { timer: 'Timer', stats: 'Statistics', settings: 'Settings', tools: 'Tools', history: 'History', virtual: 'Virtual cube', features: 'Features', sessions: 'Sessions' },
  es: { timer: 'Cronómetro', stats: 'Estadísticas', settings: 'Ajustes', tools: 'Herramientas', history: 'Historial', virtual: 'Cubo virtual', features: 'Funciones', sessions: 'Sesiones' },
  fr: { timer: 'Chrono', stats: 'Statistiques', settings: 'Réglages', tools: 'Outils', history: 'Historique', virtual: 'Cube virtuel', features: 'Fonctions', sessions: 'Sessions' },
  de: { timer: 'Timer', stats: 'Statistik', settings: 'Einstellungen', tools: 'Werkzeuge', history: 'Verlauf', virtual: 'Virtueller Cube', features: 'Funktionen', sessions: 'Sessions' },
  zh: { timer: '计时', stats: '统计', settings: '设置', tools: '工具', history: '历史', virtual: '虚拟魔方', features: '功能', sessions: '分组' },
  ja: { timer: 'タイマー', stats: '統計', settings: '設定', tools: 'ツール', history: '履歴', virtual: 'バーチャルキューブ', features: '機能', sessions: 'セッション' },
};

export const LANGUAGES = [
  ['en', 'English'],
  ['es', 'Español'],
  ['fr', 'Français'],
  ['de', 'Deutsch'],
  ['zh', '中文'],
  ['ja', '日本語'],
];

export function translate(language, key) {
  return STRINGS[language]?.[key] || STRINGS.en[key] || key;
}
