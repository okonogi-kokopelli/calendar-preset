// URLパターン
export const CALENDAR_URL_PATTERN = 'calendar.google.com';
export const CALENDAR_URL_MATCH = 'https://calendar.google.com/*';

// デフォルト設定
export const DEFAULT_SETTINGS = {
  saveViewTypeByDefault: true,
  applyViewTypeByDefault: true
};

/**
 * デフォルトのincludePrimary設定
 * 「全て解除」機能実行時に、プライマリカレンダー（最初のカレンダー）を解除するかどうかの設定
 *
 * - true: プライマリカレンダーも含めて全て解除
 * - false: プライマリカレンダーを残して他のカレンダーのみ解除（デフォルト）
 *
 * プライマリカレンダーは通常、ユーザーのメインカレンダーを指します（共有カレンダーやサブカレンダーではない）
 */
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
// カレンダー項目検出時の最大テキスト長
export const MAX_CALENDAR_TEXT_LENGTH = 200;

// プリセット適用時のタイミング設定（表示形式切り替え時）
export const URL_CHANGE_POLL_INTERVAL_MS = 200;      // URL変更を確認する間隔（ms）
export const URL_CHANGE_MAX_ATTEMPTS = 50;           // 最大試行回数（200ms × 50 = 10秒）
export const EARLY_CANCEL_DETECTION_THRESHOLD = 10;  // 早期キャンセル検知の閾値（200ms × 10 = 2秒）
export const PAGE_LOAD_TIMEOUT_MS = 5000;            // ページ読み込みのタイムアウト（ms）
export const POST_TIMEOUT_MAX_CHECKS = 50;           // タイムアウト後の追加確認回数（200ms × 50 = 10秒）
export const CALENDAR_INIT_DELAY_MS = 1000;          // カレンダー初期化待機時間（ms）
