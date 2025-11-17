// URLパターン
export const CALENDAR_URL_PATTERN = 'calendar.google.com';
export const CALENDAR_URL_MATCH = 'https://calendar.google.com/*';

// デフォルト設定
export const DEFAULT_SETTINGS = {
  saveViewTypeByDefault: true,
  applyViewTypeByDefault: true
};

// デフォルトのincludePrimary設定
export const DEFAULT_INCLUDE_PRIMARY = false;

// 表示形式の日本語ラベル
export const VIEW_TYPE_LABELS = {
  'day': '日',
  'week': '週',
  'month': '月',
  'year': '年',
  'agenda': 'スケジュール',
  'customweek': 'カスタム（週）',
  'customday': 'カスタム（日）'
};

// スクロール設定
export const SCROLL_STEP_RATIO = 0.8; // 画面の80%ずつスクロール
export const SCROLL_STEP_MIN = 200;   // 最小スクロール量（px）
export const SCROLL_DELAY = 30;       // スクロール間の待機時間（ms）

// サイドパネル設定
export const SIDEPANEL_MIN_INTERVAL = 50; // 最小間隔（ms）

// 入力制限
export const MAX_PRESET_NAME_LENGTH = 100;
export const MAX_CALENDAR_TEXT_LENGTH = 200;
