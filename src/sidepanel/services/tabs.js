import { CALENDAR_URL_PATTERN } from '../../shared/constants.js';

// カレンダータブかチェック
export async function isCalendarTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab && tab.url && tab.url.includes(CALENDAR_URL_PATTERN);
}

// アクティブなタブを取得
export async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// タブにメッセージを送信
export async function sendMessageToTab(tabId, message) {
  return await chrome.tabs.sendMessage(tabId, message);
}
