// サイドパネルの開閉状態を管理（windowIdごと）
const sidePanelState = new Map();

// アクションアイコンをクリック/ショートカット押下時にサイドパネルをトグル
chrome.action.onClicked.addListener(async (tab) => {
  // Googleカレンダーのページでのみサイドパネルを有効化
  if (tab.url && tab.url.includes('calendar.google.com')) {
    const windowId = tab.windowId;
    const isOpen = sidePanelState.get(windowId) || false;

    if (isOpen) {
      // 既に開いている場合は閉じる
      // サイドパネルにメッセージを送って閉じるよう指示
      chrome.runtime.sendMessage({ action: 'closeSidePanel' });
      sidePanelState.set(windowId, false);
    } else {
      // 閉じている場合は開く
      await chrome.sidePanel.open({ windowId: windowId });
      sidePanelState.set(windowId, true);
    }
  }
  // 他のページでは何もしない（自動開閉機能で対応）
});

// サイドパネルから閉じられたことを通知されたら状態を更新
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // メッセージ検証
  if (!request || typeof request !== 'object') {
    return;
  }

  if (!request.action || typeof request.action !== 'string') {
    return;
  }

  // 許可されたアクションのみ
  if (request.action === 'sidePanelClosed') {
    if (sender.tab) {
      sidePanelState.set(sender.tab.windowId, false);
    }
  }
});

// ウィンドウが閉じられたら状態をクリア
chrome.windows.onRemoved.addListener((windowId) => {
  sidePanelState.delete(windowId);
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
    const isOpen = sidePanelState.get(windowId) || false;

    if (isCalendarPage && !isOpen) {
      // Googleカレンダーのページでサイドパネルを自動で開く
      await chrome.sidePanel.open({ windowId: windowId });
      sidePanelState.set(windowId, true);
    }
    // Note: Chrome APIの制限により、サイドパネルを自動で閉じることはできません
    // ユーザーが手動で閉じる必要があります
  } catch (error) {
    console.error('Error handling tab change:', error);
  }
}

// 拡張機能インストール時
chrome.runtime.onInstalled.addListener(() => {
  // インストール完了（必要に応じて初期化処理を追加）
});
