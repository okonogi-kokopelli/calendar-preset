import {
  canProcess,
  markProcessing,
  unmarkProcessing,
  getSidePanelState,
  setSidePanelState
} from './state.js';

// 同期的にサイドパネルをトグルする関数（ユーザージェスチャー保持）
export function toggleSidePanelSync(windowId) {
  // 処理可能かチェック
  if (!canProcess(windowId)) {
    return;
  }

  // 処理中フラグを立てる
  markProcessing(windowId);

  const isOpen = getSidePanelState(windowId);

  if (isOpen) {
    // サイドパネルを閉じる（path: null で強制的に閉じる）
    chrome.sidePanel.setOptions({
      path: null,
      enabled: false
    })
      .then(() => {
        setSidePanelState(windowId, false);
        // サイドパネルを再度有効化
        return chrome.sidePanel.setOptions({
          path: 'sidepanel.html',
          enabled: true
        });
      })
      .catch((error) => {
        console.error('Failed to close side panel:', error);
        setSidePanelState(windowId, false);
      })
      .finally(() => {
        // 処理完了後フラグを解除
        unmarkProcessing(windowId);
      });
  } else {
    // 閉じている場合は開く
    chrome.sidePanel.open({ windowId: windowId })
      .then(() => {
        setSidePanelState(windowId, true);
      })
      .catch((openError) => {
        console.error('Failed to open side panel:', openError);
        setSidePanelState(windowId, false);
      })
      .finally(() => {
        // 処理完了後フラグを解除
        unmarkProcessing(windowId);
      });
  }
}
