import { MAX_CALENDAR_TEXT_LENGTH } from '../../shared/constants.js';

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

    // カレンダー関連のキーワードを含む場合のみ展開
    const isCalendarGroup = text.includes('カレンダー') ||
                           text.includes('calendar') ||
                           ariaLabel.includes('カレンダー') ||
                           ariaLabel.includes('calendar') ||
                           text.includes('マイ') ||
                           text.includes('My') ||
                           text.includes('他の') ||
                           text.includes('Other');

    if (isCalendarGroup) {
      button.click();
      expandedCount++;
    }
  });

  // 展開後のDOMの更新を待つ
  if (expandedCount > 0) {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// スクロール可能な親要素を見つける
export function findScrollableElement(sampleElement) {
  let scrollableElement = sampleElement.parentElement;
  let attempts = 0;

  while (scrollableElement && scrollableElement !== document.body && attempts < 20) {
    const style = window.getComputedStyle(scrollableElement);
    const hasScroll = scrollableElement.scrollHeight > scrollableElement.clientHeight + 10;

    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && hasScroll) {
      return scrollableElement;
    }

    scrollableElement = scrollableElement.parentElement;
    attempts++;
  }

  return null;
}

// サンプルチェックボックスを探す
export function findSampleCheckbox() {
  return Array.from(document.querySelectorAll('input[type="checkbox"]')).find(cb => {
    const parent = cb.closest('li') || cb.closest('div');
    const text = parent?.textContent?.trim() || '';
    return text.length > 0 && text.length < MAX_CALENDAR_TEXT_LENGTH && !text.includes('検索');
  });
}

// カレンダーチェックボックスかどうかを判定
export function isCalendarCheckbox(checkbox) {
  const parent = checkbox.closest('li') || checkbox.closest('div') || checkbox.parentElement;
  const rawText = parent?.textContent?.trim() || '';
  return rawText && rawText.length > 0 && rawText.length < MAX_CALENDAR_TEXT_LENGTH && !rawText.includes('検索');
}
