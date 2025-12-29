// i18n ユーティリティ

/**
 * 現在のUIロケールが日本語かどうかを判定
 * @returns {boolean} 日本語の場合true
 */
export function isJapanese() {
  const uiLanguage = chrome.i18n.getUILanguage();
  return uiLanguage.startsWith('ja');
}

/**
 * ローカライズされたメッセージを取得
 * @param {string} key メッセージキー
 * @param {string|string[]} substitutions プレースホルダーの置換値
 * @returns {string} ローカライズされたメッセージ
 */
export function getMessage(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

/**
 * 表示形式のラベルを取得（i18n対応）
 * @param {string} viewType 表示形式のキー（day, week, month, year, agenda, customweek, customday）
 * @returns {string} ローカライズされたラベル
 */
export function getViewTypeLabel(viewType) {
  if (!viewType) return '-';

  const keyMap = {
    'day': 'viewTypeDay',
    'week': 'viewTypeWeek',
    'month': 'viewTypeMonth',
    'year': 'viewTypeYear',
    'agenda': 'viewTypeAgenda',
    'customweek': 'viewTypeCustomWeek',
    'customday': 'viewTypeCustomDay'
  };

  const key = keyMap[viewType];
  if (key) {
    const message = chrome.i18n.getMessage(key);
    if (message) {
      return message;
    }
  }

  // フォールバック（英語）
  const fallback = {
    'day': 'Day',
    'week': 'Week',
    'month': 'Month',
    'year': 'Year',
    'agenda': 'Schedule',
    'customweek': 'Custom (Week)',
    'customday': 'Custom (Day)'
  };
  return fallback[viewType] || viewType;
}

/**
 * HTMLのdata-i18n属性を持つ要素を翻訳
 */
export function translatePage() {
  try {
    // data-i18n属性を持つ要素のテキストを翻訳
    document.querySelectorAll('[data-i18n]').forEach(element => {
      try {
        const key = element.getAttribute('data-i18n');
        const message = chrome.i18n.getMessage(key);
        // 翻訳が取得できた場合のみテキストを更新（空の場合は既存テキストを維持）
        if (message) {
          element.textContent = message;
        }
      } catch (e) {
        console.warn('Failed to translate element:', element, e);
      }
    });

    // data-i18n-placeholder属性を持つ要素のplaceholderを翻訳
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      try {
        const key = element.getAttribute('data-i18n-placeholder');
        const message = chrome.i18n.getMessage(key);
        // 翻訳が取得できた場合のみplaceholderを更新（空の場合は既存を維持）
        if (message) {
          element.placeholder = message;
        }
      } catch (e) {
        console.warn('Failed to translate placeholder:', element, e);
      }
    });

    // html lang属性を現在のロケールに設定
    document.documentElement.lang = isJapanese() ? 'ja' : 'en';
  } catch (e) {
    console.error('Failed to translate page:', e);
  }
}
