import {
  URL_CHANGE_POLL_INTERVAL_MS,
  URL_CHANGE_MAX_ATTEMPTS,
  EARLY_CANCEL_DETECTION_THRESHOLD,
  PAGE_LOAD_TIMEOUT_MS,
  POST_TIMEOUT_MAX_CHECKS
} from '../../shared/constants.js';

/**
 * ページ遷移を実行し、完了を待つ
 * @param {Object} tab - タブオブジェクト
 * @param {string} currentUrl - 現在のURL
 * @param {string} newUrl - 遷移先URL
 * @param {string} targetViewType - 確認対象のviewType
 * @returns {Promise<{success: boolean, cancelled: boolean}>}
 */
export async function waitForPageTransition(tab, currentUrl, newUrl, targetViewType) {
  // ========================================
  // ステップ1: ページ遷移を開始
  // ========================================
  // chrome.tabs.update()を使用してURLを変更
  // （content scriptからの遷移ではないため、警告が出にくい）
  await chrome.tabs.update(tab.id, { url: newUrl });

  // ========================================
  // ステップ2: URLが実際に変わるまで待つ
  // ========================================
  // chrome.tabs.update()を呼んでも、実際にURLが変わるまでに時間がかかる
  // また、「このサイトを離れますか？」のダイアログでユーザーが決断するまで時間がかかる場合がある
  // そのため、URLが変わったことを確認するまでポーリング
  let urlChanged = false;

  for (let i = 0; i < URL_CHANGE_MAX_ATTEMPTS; i++) {
    await new Promise(resolve => setTimeout(resolve, URL_CHANGE_POLL_INTERVAL_MS));
    const currentTab = await chrome.tabs.get(tab.id);

    // URL変更を検知
    if (currentTab.url.includes(targetViewType)) {
      urlChanged = true;
      break; // URL変更を検知したらループを抜ける
    }

    // 早期キャンセル検知（2秒経過後）
    // URLが変わらず、かつページが完了状態（complete）の場合、キャンセルされた可能性が高い
    if (i >= EARLY_CANCEL_DETECTION_THRESHOLD &&
        currentTab.url === currentUrl &&
        currentTab.status === 'complete') {
      break; // キャンセルと判断して早期終了
    }
  }

  // URLが変わらなかった場合 = ページ遷移がキャンセルされた
  if (!urlChanged) {
    return { success: false, cancelled: true };
  }

  // ========================================
  // ステップ3: ページ読み込み完了を待つ
  // ========================================
  // URLは変わったが、ページの読み込みが完了するまで待つ必要がある
  // タイムアウト付きでページ読み込み完了を待機（レースコンディション対策）
  const loadResult = await new Promise((resolve) => {
    let finished = false;
    let listener = null;

    const timeoutId = setTimeout(() => {
      if (!finished) {
        finished = true;
        if (listener) chrome.tabs.onUpdated.removeListener(listener);
        resolve('timeout');
      }
    }, PAGE_LOAD_TIMEOUT_MS);

    listener = (tabId, changeInfo, updatedTab) => {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        if (!finished) {
          finished = true;
          chrome.tabs.onUpdated.removeListener(listener);
          clearTimeout(timeoutId);
          resolve('complete');
        }
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });

  // タイムアウトした場合、追加で待機
  if (loadResult === 'timeout') {
    // タイムアウト後も追加で待機（ユーザーが遅れて「離れる」をクリックした場合に対応）
    // 最大10秒間、200msごとにポーリングでページ遷移完了を確認
    for (let i = 0; i < POST_TIMEOUT_MAX_CHECKS; i++) {
      await new Promise(resolve => setTimeout(resolve, URL_CHANGE_POLL_INTERVAL_MS));
      const currentTab = await chrome.tabs.get(tab.id);

      // ページ遷移が完了したか確認（URLが変わって、読み込み完了）
      if (currentTab.url.includes(targetViewType) &&
          currentTab.status === 'complete') {
        break; // 遷移完了を検知してループを抜ける
      }
    }
  }

  // ========================================
  // ステップ4: 最終確認
  // ========================================
  // タイムアウト後も、URLが本当に変わったか最終確認
  // （遅延してキャンセルされた場合に備えて）
  const updatedTab = await chrome.tabs.get(tab.id);
  if (!updatedTab.url.includes(targetViewType)) {
    return { success: false, cancelled: true };
  }

  return { success: true, cancelled: false };
}
