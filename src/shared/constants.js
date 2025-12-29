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

// スクロール設定
export const SCROLL_STEP_RATIO = 0.8; // 画面の80%ずつスクロール
export const SCROLL_STEP_MIN = 200;   // 最小スクロール量（px）
export const SCROLL_DELAY = 20;       // スクロール間の待機時間（ms）

/**
 * 仮想スクロール処理の早期終了判定の閾値
 *
 * スクロール中に新しいチェックボックスが見つからない状態が
 * この回数連続で続いた場合、全てのチェックボックスを処理したと判断して
 * スクロールを終了します。
 *
 * 仮想スクロールではDOMの更新にラグがあるため、1回見つからなかっただけでは
 * 終了せず、複数回確認することで信頼性を確保しています。
 */
export const MAX_NO_NEW_CHECKBOX_COUNT = 3;

// サイドパネル設定
export const SIDEPANEL_MIN_INTERVAL = 50; // 最小間隔（ms）

// 入力制限
export const MAX_PRESET_NAME_LENGTH = 100;
// カレンダー項目検出時の最大テキスト長
export const MAX_CALENDAR_TEXT_LENGTH = 200;

// プリセット適用時のタイミング設定（表示形式切り替え時）
export const URL_CHANGE_POLL_INTERVAL_MS = 100;      // URL変更を確認する間隔（ms）
export const URL_CHANGE_MAX_ATTEMPTS = 50;           // 最大試行回数（100ms × 50 = 5秒）
export const EARLY_CANCEL_DETECTION_THRESHOLD = 10;  // 早期キャンセル検知の閾値（100ms × 10 = 1秒）
export const PAGE_LOAD_TIMEOUT_MS = 5000;            // ページ読み込みのタイムアウト（ms）
export const POST_TIMEOUT_MAX_CHECKS = 50;           // タイムアウト後の追加確認回数（100ms × 50 = 5秒）
export const CALENDAR_INIT_DELAY_MS = 500;           // カレンダー初期化待機時間（ms）

/**
 * カレンダーグループ判定用キーワード
 * 折りたたまれているグループを展開する際に、カレンダーグループかどうかを判定するために使用
 * 新しい言語を追加する場合はここにキーワードを追加
 */
export const CALENDAR_GROUP_KEYWORDS = [
  // 日本語
  'カレンダー',
  'マイ',
  '他の',
  // 英語
  'calendar',
  'My',
  'Other'
];

/**
 * 検索フィールド判定用キーワード
 * カレンダーチェックボックス検出時に検索フィールドを除外するために使用
 * 新しい言語を追加する場合はここにキーワードを追加
 */
export const SEARCH_FIELD_KEYWORDS = [
  // 日本語
  '検索',
  // 英語
  'search'
];
