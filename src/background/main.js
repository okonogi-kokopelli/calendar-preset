import { CALENDAR_URL_PATTERN } from '../shared/constants.js';
import { toggleSidePanelSync } from './sidepanel.js';
import {
  handleWindowRemoved,
  handleTabActivated,
  handleTabUpdated
} from './tabs.js';

// アクションアイコンをクリック時（またはショートカットキー）にサイドパネルをトグル
chrome.action.onClicked.addListener((tab) => {
  // Googleカレンダーのページでのみサイドパネルを有効化
  if (tab.url && tab.url.includes(CALENDAR_URL_PATTERN)) {
    toggleSidePanelSync(tab.windowId);
  }
});

// ウィンドウが閉じられたら状態をクリア
chrome.windows.onRemoved.addListener(handleWindowRemoved);

// タブが切り替えられた時
chrome.tabs.onActivated.addListener(handleTabActivated);

// タブのURLが更新された時（ページ内遷移対応）
chrome.tabs.onUpdated.addListener(handleTabUpdated);

// 拡張機能インストール時
chrome.runtime.onInstalled.addListener(() => {
  // インストール完了（必要に応じて初期化処理を追加）
});
