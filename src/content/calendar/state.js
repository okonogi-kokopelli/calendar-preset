import { expandAllCalendarGroups, findScrollableElement, findSampleCheckbox, isCalendarCheckbox } from './dom.js';
import { getCalendarId, getCalendarName, getCurrentViewType } from './utils.js';
import { SCROLL_STEP_RATIO, SCROLL_STEP_MIN, SCROLL_DELAY } from '../../shared/constants.js';

// カレンダーの状態を取得（チェックされているカレンダーのIDだけ返す）
// 段階的スクロールで仮想スクロールに対応
export async function getCurrentState() {
  // グループを展開
  await expandAllCalendarGroups();

  const checkedCalendarIds = [];

  // まず1つのカレンダーチェックボックスを見つける
  const sampleCheckbox = findSampleCheckbox();

  if (!sampleCheckbox) {
    // チェックボックスが見つからない場合は空の結果を返す
    return {
      calendars: [],
      viewType: getCurrentViewType()
    };
  }

  // スクロール可能な親要素を探す
  const scrollableElement = findScrollableElement(sampleCheckbox);

  if (!scrollableElement) {
    // スクロールなしで直接取得
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

    allCheckboxes.forEach((checkbox) => {
      if (!isCalendarCheckbox(checkbox)) return;

      const calendarId = getCalendarId(checkbox);
      const calendarName = getCalendarName(checkbox);

      // チェックされているカレンダーのIDだけ追加
      if (calendarId && calendarName && checkbox.checked) {
        checkedCalendarIds.push(calendarId);
      }
    });

    return {
      calendars: checkedCalendarIds,
      viewType: getCurrentViewType()
    };
  }

  // スクロール可能なコンテナが見つかった場合、段階的スクロール
  const originalScrollTop = scrollableElement.scrollTop;
  const scrollHeight = scrollableElement.scrollHeight;
  const clientHeight = scrollableElement.clientHeight;

  // 処理済みのチェックボックスを記録（重複防止）
  const processedCheckboxes = new Set();

  // 上から下へ段階的にスクロール
  const scrollStep = Math.max(clientHeight * SCROLL_STEP_RATIO, SCROLL_STEP_MIN);
  scrollableElement.scrollTop = 0;

  for (let scrollPos = 0; scrollPos <= scrollHeight; scrollPos += scrollStep) {
    scrollableElement.scrollTop = scrollPos;
    await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

    // 現在表示されているチェックボックスを取得
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

    allCheckboxes.forEach((checkbox) => {
      if (processedCheckboxes.has(checkbox)) return;
      if (!isCalendarCheckbox(checkbox)) return;

      processedCheckboxes.add(checkbox);

      const calendarId = getCalendarId(checkbox);
      const calendarName = getCalendarName(checkbox);

      // チェックされているカレンダーのIDだけ追加
      if (calendarId && calendarName && checkbox.checked) {
        checkedCalendarIds.push(calendarId);
      }
    });
  }

  // 元の位置に戻す
  scrollableElement.scrollTop = originalScrollTop;

  return {
    calendars: checkedCalendarIds,
    viewType: getCurrentViewType()
  };
}
