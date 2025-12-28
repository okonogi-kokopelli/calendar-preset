import { expandAllCalendarGroups, findScrollableElement, findSampleCheckbox, isCalendarCheckbox } from './dom.js';
import { setCheckboxState, getCalendarId } from './utils.js';
import { SCROLL_STEP_RATIO, SCROLL_STEP_MIN, SCROLL_DELAY, MAX_NO_NEW_CHECKBOX_COUNT } from '../../shared/constants.js';

// 実行中フラグ（連続クリック防止）
let isExecuting = false;

/**
 * 早期終了判定を行うカウンターを更新する
 *
 * 新しいチェックボックスが見つからない状態が続いた場合、
 * スクロールを早期終了するための判定を行います。
 *
 * @param {boolean} foundNew - 新しいチェックボックスが見つかったかどうか
 * @param {number} noNewCheckboxCount - 現在のカウント値
 * @returns {{ count: number, shouldTerminate: boolean }} 更新後のカウントと終了判定
 */
function updateEarlyTerminationCheck(foundNew, noNewCheckboxCount) {
  if (foundNew) {
    return { count: 0, shouldTerminate: false };
  }
  const newCount = noNewCheckboxCount + 1;
  return { count: newCount, shouldTerminate: newCount >= MAX_NO_NEW_CHECKBOX_COUNT };
}

/**
 * プリセットを適用してカレンダーのチェック状態を変更する
 *
 * Googleカレンダーの仮想スクロールに対応するため、段階的にスクロールしながら
 * 全てのチェックボックスを処理します。
 *
 * @param {string[]} calendars - チェックするカレンダーIDの配列
 *   この配列に含まれるカレンダーはチェックされ、含まれないカレンダーはチェック解除されます。
 *   各文字列はカレンダーの一意な識別子（data-id属性またはカレンダー名）です。
 * @returns {Promise<void>} 全てのチェックボックスの処理が完了したら解決されます
 *
 * @description
 * スクロール戦略:
 *   - スクロール可能なコンテナを検出した場合、段階的にスクロールします
 *   - 各ステップで一時停止し、DOMが更新されるのを待ちます
 *   - これにより、仮想スクロールでレンダリングされるチェックボックスも確実に処理できます
 *
 * 重複排除:
 *   - processedCheckboxesセットでチェックボックスを追跡
 *   - スクロール中に同じ要素を複数回処理することを防ぎます
 */
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

    let noNewCheckboxCount = 0;

    for (let scrollPos = 0; scrollPos <= scrollHeight; scrollPos += scrollStep) {
      scrollableElement.scrollTop = scrollPos;
      await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

      // 現在表示されているチェックボックスを操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      let foundNew = false;

      allCheckboxes.forEach((checkbox) => {
        if (processedCheckboxes.has(checkbox)) return;
        if (!isCalendarCheckbox(checkbox)) return;

        foundNew = true;
        processedCheckboxes.add(checkbox);

        const calendarId = getCalendarId(checkbox);
        const shouldBeChecked = checkedCalendarIds.has(calendarId);

        if (checkbox.checked !== shouldBeChecked) {
          setCheckboxState(checkbox, shouldBeChecked);
          totalChanged++;
        }
      });

      const termination = updateEarlyTerminationCheck(foundNew, noNewCheckboxCount);
      noNewCheckboxCount = termination.count;
      if (termination.shouldTerminate) {
        break;
      }
    }

    // 元の位置に戻す
    scrollableElement.scrollTop = originalScrollTop;
  } finally {
    isExecuting = false;
  }
}

/**
 * 全てのカレンダーを選択する
 *
 * Googleカレンダーの仮想スクロールに対応するため、段階的にスクロールしながら
 * 全てのチェックボックスをチェック状態にします。
 *
 * @returns {Promise<void>} 全てのチェックボックスの処理が完了したら解決されます
 *
 * @description
 * applyPresetと同じスクロール戦略を使用して、仮想スクロールコンテナ内の
 * 全てのカレンダーチェックボックスを確実に選択します。
 */
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

    let noNewCheckboxCount = 0;

    for (let scrollPos = 0; scrollPos <= scrollHeight; scrollPos += scrollStep) {
      scrollableElement.scrollTop = scrollPos;
      await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

      // 現在表示されているチェックボックスを操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      let foundNew = false;

      allCheckboxes.forEach((checkbox) => {
        if (processedCheckboxes.has(checkbox)) return;
        if (!isCalendarCheckbox(checkbox)) return;

        foundNew = true;
        processedCheckboxes.add(checkbox);

        if (!checkbox.checked) {
          setCheckboxState(checkbox, true);
        }
      });

      const termination = updateEarlyTerminationCheck(foundNew, noNewCheckboxCount);
      noNewCheckboxCount = termination.count;
      if (termination.shouldTerminate) {
        break;
      }
    }

    // 元の位置に戻す
    scrollableElement.scrollTop = originalScrollTop;
  } finally {
    isExecuting = false;
  }
}

/**
 * 全てのカレンダーを解除する
 *
 * Googleカレンダーの仮想スクロールに対応するため、段階的にスクロールしながら
 * 全てのチェックボックスをチェック解除します。
 *
 * @param {boolean} [includePrimary=true] - プライマリカレンダー（最初のカレンダー）も解除するか
 *   true: 全てのカレンダーを解除（デフォルト）
 *   false: プライマリカレンダーを残して他のカレンダーのみ解除
 * @returns {Promise<void>} 全てのチェックボックスの処理が完了したら解決されます
 *
 * @description
 * プライマリカレンダー（リスト内の最初のカレンダー）を保持するオプションがあります。
 * これにより、ユーザーの主要カレンダーを残したまま他のカレンダーを一括解除できます。
 */
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

    let noNewCheckboxCount = 0;

    for (let scrollPos = 0; scrollPos <= scrollHeight; scrollPos += scrollStep) {
      scrollableElement.scrollTop = scrollPos;
      await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

      // 現在表示されているチェックボックスを操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      let foundNew = false;

      allCheckboxes.forEach((checkbox) => {
        if (processedCheckboxes.has(checkbox)) return;
        if (!isCalendarCheckbox(checkbox)) return;

        foundNew = true;
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

      const termination = updateEarlyTerminationCheck(foundNew, noNewCheckboxCount);
      noNewCheckboxCount = termination.count;
      if (termination.shouldTerminate) {
        break;
      }
    }

    // 元の位置に戻す
    scrollableElement.scrollTop = originalScrollTop;
  } finally {
    isExecuting = false;
  }
}
