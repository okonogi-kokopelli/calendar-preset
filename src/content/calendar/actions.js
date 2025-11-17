import { expandAllCalendarGroups, findScrollableElement, findSampleCheckbox, isCalendarCheckbox } from './dom.js';
import { setCheckboxState, getCalendarId } from './utils.js';
import { SCROLL_STEP_RATIO, SCROLL_STEP_MIN, SCROLL_DELAY } from '../../shared/constants.js';

// 実行中フラグ（連続クリック防止）
let isExecuting = false;

// カレンダーの状態を適用（段階的スクロール）
// calendarsはチェックするカレンダーIDの配列
export async function applyPreset(calendars) {
  if (isExecuting) {
    return;
  }

  isExecuting = true;

  try {
    // グループを展開
    await expandAllCalendarGroups();

    // カレンダーIDのSetに変換（高速検索用）
    const checkedCalendarIds = new Set(calendars);

    // まず1つのカレンダーチェックボックスを見つける
    const sampleCheckbox = findSampleCheckbox();

    if (!sampleCheckbox) {
      return;
    }

    // スクロール可能な親要素を探す
    const scrollableElement = findScrollableElement(sampleCheckbox);

    if (!scrollableElement) {
      // スクロールなしで直接操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      let totalChanged = 0;

      allCheckboxes.forEach((checkbox) => {
        if (!isCalendarCheckbox(checkbox)) return;

        const calendarId = getCalendarId(checkbox);
        const shouldBeChecked = checkedCalendarIds.has(calendarId);

        if (checkbox.checked !== shouldBeChecked) {
          setCheckboxState(checkbox, shouldBeChecked);
          totalChanged++;
        }
      });

      return;
    }

    // スクロール可能なコンテナが見つかった場合、段階的スクロール
    const originalScrollTop = scrollableElement.scrollTop;
    const scrollHeight = scrollableElement.scrollHeight;
    const clientHeight = scrollableElement.clientHeight;

    // 操作済みのチェックボックスを記録（重複操作防止）
    const processedCheckboxes = new Set();
    let totalChanged = 0;

    // 上から下へ段階的にスクロール
    const scrollStep = Math.max(clientHeight * SCROLL_STEP_RATIO, SCROLL_STEP_MIN);
    scrollableElement.scrollTop = 0;

    for (let scrollPos = 0; scrollPos <= scrollHeight; scrollPos += scrollStep) {
      scrollableElement.scrollTop = scrollPos;
      await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

      // 現在表示されているチェックボックスを操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

      allCheckboxes.forEach((checkbox) => {
        if (processedCheckboxes.has(checkbox)) return;
        if (!isCalendarCheckbox(checkbox)) return;

        processedCheckboxes.add(checkbox);

        const calendarId = getCalendarId(checkbox);
        const shouldBeChecked = checkedCalendarIds.has(calendarId);

        if (checkbox.checked !== shouldBeChecked) {
          setCheckboxState(checkbox, shouldBeChecked);
          totalChanged++;
        }
      });
    }

    // 元の位置に戻す
    scrollableElement.scrollTop = originalScrollTop;
  } finally {
    isExecuting = false;
  }
}

// 全て選択（段階的スクロール）
export async function selectAll() {
  if (isExecuting) {
    return;
  }

  isExecuting = true;

  try {
    // グループを展開
    await expandAllCalendarGroups();

    // まず1つのカレンダーチェックボックスを見つける
    const sampleCheckbox = findSampleCheckbox();

    if (!sampleCheckbox) {
      return;
    }

    // スクロール可能な親要素を探す
    const scrollableElement = findScrollableElement(sampleCheckbox);

    if (!scrollableElement) {
      // スクロールなしで直接操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

      allCheckboxes.forEach((checkbox) => {
        if (!isCalendarCheckbox(checkbox)) return;

        if (!checkbox.checked) {
          setCheckboxState(checkbox, true);
        }
      });

      return;
    }

    // スクロール可能なコンテナが見つかった場合、段階的スクロール
    const originalScrollTop = scrollableElement.scrollTop;
    const scrollHeight = scrollableElement.scrollHeight;
    const clientHeight = scrollableElement.clientHeight;

    // 操作済みのチェックボックスを記録（重複操作防止）
    const processedCheckboxes = new Set();

    // 上から下へ段階的にスクロール
    const scrollStep = Math.max(clientHeight * SCROLL_STEP_RATIO, SCROLL_STEP_MIN);
    scrollableElement.scrollTop = 0;

    for (let scrollPos = 0; scrollPos <= scrollHeight; scrollPos += scrollStep) {
      scrollableElement.scrollTop = scrollPos;
      await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

      // 現在表示されているチェックボックスを操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

      allCheckboxes.forEach((checkbox) => {
        if (processedCheckboxes.has(checkbox)) return;
        if (!isCalendarCheckbox(checkbox)) return;

        processedCheckboxes.add(checkbox);

        if (!checkbox.checked) {
          setCheckboxState(checkbox, true);
        }
      });
    }

    // 元の位置に戻す
    scrollableElement.scrollTop = originalScrollTop;
  } finally {
    isExecuting = false;
  }
}

// 全て解除（段階的スクロール）
export async function deselectAll(includePrimary = true) {
  if (isExecuting) {
    return;
  }

  isExecuting = true;

  try {
    // グループを展開
    await expandAllCalendarGroups();

    // まず1つのカレンダーチェックボックスを見つける
    const sampleCheckbox = findSampleCheckbox();

    if (!sampleCheckbox) {
      return;
    }

    // スクロール可能な親要素を探す
    const scrollableElement = findScrollableElement(sampleCheckbox);

    if (!scrollableElement) {
      // スクロールなしで直接操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      let primaryCalendar = null;
      let totalDeselected = 0;

      allCheckboxes.forEach((checkbox) => {
        if (!isCalendarCheckbox(checkbox)) return;

        // 最初のカレンダーをプライマリとして記録
        if (!primaryCalendar) {
          primaryCalendar = checkbox;
        }

        // includePrimaryがtrueの場合は全て解除、falseの場合はプライマリ以外を解除
        const shouldDeselect = includePrimary ? checkbox.checked : (checkbox.checked && checkbox !== primaryCalendar);

        if (shouldDeselect) {
          setCheckboxState(checkbox, false);
          totalDeselected++;
        }
      });

      return;
    }

    const originalScrollTop = scrollableElement.scrollTop;
    const scrollHeight = scrollableElement.scrollHeight;
    const clientHeight = scrollableElement.clientHeight;

    // 操作済みのチェックボックスを記録（重複操作防止）
    const processedCheckboxes = new Set();
    let primaryCalendar = null;
    let totalDeselected = 0;

    // 上から下へ段階的にスクロール
    const scrollStep = Math.max(clientHeight * SCROLL_STEP_RATIO, SCROLL_STEP_MIN);
    scrollableElement.scrollTop = 0;

    for (let scrollPos = 0; scrollPos <= scrollHeight; scrollPos += scrollStep) {
      scrollableElement.scrollTop = scrollPos;
      await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

      // 現在表示されているチェックボックスを操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

      allCheckboxes.forEach((checkbox) => {
        if (processedCheckboxes.has(checkbox)) return;
        if (!isCalendarCheckbox(checkbox)) return;

        processedCheckboxes.add(checkbox);

        // 最初のカレンダーをプライマリとして記録
        if (!primaryCalendar) {
          primaryCalendar = checkbox;
        }

        // includePrimaryがtrueの場合は全て解除、falseの場合はプライマリ以外を解除
        const shouldDeselect = includePrimary ? checkbox.checked : (checkbox.checked && checkbox !== primaryCalendar);

        if (shouldDeselect) {
          setCheckboxState(checkbox, false);
          totalDeselected++;
        }
      });
    }

    // 元の位置に戻す
    scrollableElement.scrollTop = originalScrollTop;
  } finally {
    isExecuting = false;
  }
}
