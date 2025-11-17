import { CALENDAR_URL_PATTERN } from '../shared/constants.js';
import { setSidePanelState, clearWindowState } from './state.js';

// タブ変更時の共通処理
export async function handleTabChange(tabId, windowId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const isCalendarPage = tab.url && tab.url.includes(CALENDAR_URL_PATTERN);

    if (!isCalendarPage) {
      // Googleカレンダー以外のページに切り替えた場合、状態をリセット
      setSidePanelState(windowId, false);
    }
    // Note: Chrome APIの制限により、サイドパネルを自動で開閉することはできません
    // ユーザーがショートカットキーやアイコンで操作する必要があります
  } catch (error) {
    console.error('Error handling tab change:', error);
  }
}

// ウィンドウが閉じられたときの処理
export function handleWindowRemoved(windowId) {
  clearWindowState(windowId);
}

// タブが切り替えられたときの処理
export async function handleTabActivated(activeInfo) {
  await handleTabChange(activeInfo.tabId, activeInfo.windowId);
}

// タブのURLが更新されたときの処理
export async function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.url && tab.active) {
    await handleTabChange(tabId, tab.windowId);
  }
}
