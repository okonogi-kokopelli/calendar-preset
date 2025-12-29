import { MAX_CALENDAR_TEXT_LENGTH, CALENDAR_GROUP_KEYWORDS, SEARCH_FIELD_KEYWORDS } from '../../shared/constants.js';

export function waitForDomStable(container, { timeout = 500, stableTime = 50 } = {}) {
  return new Promise((resolve) => {
    let timeoutId;
    let stableTimeoutId;

    const observer = new MutationObserver(() => {
      clearTimeout(stableTimeoutId);
      stableTimeoutId = setTimeout(() => {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve();
      }, stableTime);
    });

    observer.observe(container, { childList: true, subtree: true });

    timeoutId = setTimeout(() => {
      observer.disconnect();
      clearTimeout(stableTimeoutId);
      resolve();
    }, timeout);

    stableTimeoutId = setTimeout(() => {
      observer.disconnect();
      clearTimeout(timeoutId);
      resolve();
    }, stableTime);
  });
}

// 折りたたまれているカレンダーグループを展開
export async function expandAllCalendarGroups() {
  // カレンダーリストのコンテナを探す
  const calendarListContainer = document.querySelector('[role="navigation"]') ||
                                document.querySelector('[data-drawerid]') ||
                                document.querySelector('.YPmRfe') ||
                                document.querySelector('nav') ||
                                document.querySelector('aside');

  if (!calendarListContainer) {
    return;
  }

  // コンテナ内のみで折りたたみ可能なグループを探す
  const collapsedGroups = calendarListContainer.querySelectorAll('[aria-expanded="false"]');

  // カレンダーグループのみ展開（テキストで判定）
  let expandedCount = 0;
  collapsedGroups.forEach((button) => {
    const text = button.textContent?.trim() || button.getAttribute('aria-label') || '';
    const ariaLabel = button.getAttribute('aria-label') || '';

    // カレンダー関連のキーワードを含む場合のみ展開（大文字小文字を区別しない）
    const textLower = text.toLowerCase();
    const ariaLabelLower = ariaLabel.toLowerCase();
    const isCalendarGroup = CALENDAR_GROUP_KEYWORDS.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return textLower.includes(keywordLower) || ariaLabelLower.includes(keywordLower);
    });

    if (isCalendarGroup) {
      button.click();
      expandedCount++;
    }
  });

  // 展開後のDOMの更新を待つ（MutationObserverで完了検知）
  if (expandedCount > 0) {
    await waitForDomStable(calendarListContainer, { timeout: 500, stableTime: 50 });
  }
}

// スクロール可能な親要素を見つける
export function findScrollableElement(sampleElement) {
  let scrollableElement = sampleElement.parentElement;
  let attempts = 0;

  while (scrollableElement && scrollableElement !== document.body && attempts < 20) {
    const style = window.getComputedStyle(scrollableElement);
    const hasScroll = scrollableElement.scrollHeight > scrollableElement.clientHeight;

    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && hasScroll) {
      return scrollableElement;
    }

    scrollableElement = scrollableElement.parentElement;
    attempts++;
  }

  return null;
}

// 検索フィールドを除外するための判定（大文字小文字を区別しない）
function isSearchField(text) {
  const textLower = text.toLowerCase();
  return SEARCH_FIELD_KEYWORDS.some(keyword => textLower.includes(keyword.toLowerCase()));
}

// サンプルチェックボックスを探す
export function findSampleCheckbox() {
  return Array.from(document.querySelectorAll('input[type="checkbox"]')).find(cb => {
    const parent = cb.closest('li') || cb.closest('div');
    const text = parent?.textContent?.trim() || '';
    return text.length > 0 && text.length < MAX_CALENDAR_TEXT_LENGTH && !isSearchField(text);
  });
}

// カレンダーチェックボックスかどうかを判定
export function isCalendarCheckbox(checkbox) {
  const parent = checkbox.closest('li') || checkbox.closest('div') || checkbox.parentElement;
  const rawText = parent?.textContent?.trim() || '';
  return rawText && rawText.length > 0 && rawText.length < MAX_CALENDAR_TEXT_LENGTH && !isSearchField(rawText);
}
