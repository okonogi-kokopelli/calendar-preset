// サイドパネルの開閉状態を管理（windowIdごと）
const sidePanelState = new Map();

// 処理中フラグ（windowIdごと）
const isProcessing = new Map();

// 最後の実行時刻を記録（windowIdごと） - 予備用
const lastExecutionTime = new Map();

// 最小間隔（ミリ秒） - 二重チェック用
const MIN_INTERVAL = 50;

// ショートカットキーのコマンドリスナー
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'toggle-side-panel') {
    if (tab && tab.url && tab.url.includes('calendar.google.com')) {
      // 同期的に実行してユーザージェスチャーのコンテキストを保持
      toggleSidePanelSync(tab.windowId);
    }
  }
});

// 同期的にサイドパネルをトグルする関数（ユーザージェスチャー保持）
function toggleSidePanelSync(windowId) {
  // 処理中チェック
  if (isProcessing.get(windowId)) {
    return;
  }

  // 二重チェック: 最小間隔チェック
  const now = Date.now();
  const lastTime = lastExecutionTime.get(windowId) || 0;
  const timeSinceLastExecution = now - lastTime;

  if (timeSinceLastExecution < MIN_INTERVAL) {
    return;
  }

  // 処理中フラグを立てる
  isProcessing.set(windowId, true);
  lastExecutionTime.set(windowId, now);

  const isOpen = sidePanelState.get(windowId) || false;

  if (isOpen) {
    // サイドパネルを閉じる（path: null で強制的に閉じる）
    chrome.sidePanel.setOptions({
      path: null,
      enabled: false
    })
      .then(() => {
        sidePanelState.set(windowId, false);
        // サイドパネルを再度有効化
        return chrome.sidePanel.setOptions({
          path: 'popup.html',
          enabled: true
        });
      })
      .catch((error) => {
        console.error('Failed to close side panel:', error);
        sidePanelState.set(windowId, false);
      })
      .finally(() => {
        // 処理完了後フラグを解除
        isProcessing.set(windowId, false);
      });
  } else {
    // 閉じている場合は開く
    chrome.sidePanel.open({ windowId: windowId })
      .then(() => {
        sidePanelState.set(windowId, true);
      })
      .catch((openError) => {
        console.error('Failed to open side panel:', openError);
        sidePanelState.set(windowId, false);
      })
      .finally(() => {
        // 処理完了後フラグを解除
        isProcessing.set(windowId, false);
      });
  }
}

// アクションアイコンをクリック時にサイドパネルをトグル
chrome.action.onClicked.addListener((tab) => {
  // Googleカレンダーのページでのみサイドパネルを有効化
  if (tab.url && tab.url.includes('calendar.google.com')) {
    toggleSidePanelSync(tab.windowId);
  }
});


// ウィンドウが閉じられたら状態をクリア
chrome.windows.onRemoved.addListener((windowId) => {
  sidePanelState.delete(windowId);
  lastExecutionTime.delete(windowId);
  isProcessing.delete(windowId);
});

// タブが切り替えられた時
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await handleTabChange(activeInfo.tabId, activeInfo.windowId);
});

// タブのURLが更新された時（ページ内遷移対応）
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    await handleTabChange(tabId, tab.windowId);
  }
});

// タブ変更時の共通処理
async function handleTabChange(tabId, windowId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const isCalendarPage = tab.url && tab.url.includes('calendar.google.com');

    if (!isCalendarPage) {
      // Googleカレンダー以外のページに切り替えた場合、状態をリセット
      sidePanelState.set(windowId, false);
    }
    // Note: Chrome APIの制限により、サイドパネルを自動で開閉することはできません
    // ユーザーがショートカットキーやアイコンで操作する必要があります
  } catch (error) {
    console.error('Error handling tab change:', error);
  }
}

// 拡張機能インストール時
chrome.runtime.onInstalled.addListener(() => {
  // インストール完了（必要に応じて初期化処理を追加）
});
