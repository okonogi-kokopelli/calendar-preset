import { SIDEPANEL_MIN_INTERVAL } from '../shared/constants.js';

// サイドパネルの開閉状態を管理（windowIdごと）
export const sidePanelState = new Map();

// 処理中フラグ（windowIdごと）
export const isProcessing = new Map();

// 最後の実行時刻を記録（windowIdごと） - 予備用
export const lastExecutionTime = new Map();

// 最小間隔（ミリ秒） - 二重チェック用
export const MIN_INTERVAL = SIDEPANEL_MIN_INTERVAL;

// 処理可能かチェック
export function canProcess(windowId) {
  // 処理中チェック
  if (isProcessing.get(windowId)) {
    return false;
  }

  // 二重チェック: 最小間隔チェック
  const now = Date.now();
  const lastTime = lastExecutionTime.get(windowId) || 0;
  const timeSinceLastExecution = now - lastTime;

  if (timeSinceLastExecution < MIN_INTERVAL) {
    return false;
  }

  return true;
}

// 処理開始をマーク
export function markProcessing(windowId) {
  isProcessing.set(windowId, true);
  lastExecutionTime.set(windowId, Date.now());
}

// 処理終了をマーク
export function unmarkProcessing(windowId) {
  isProcessing.set(windowId, false);
}

// サイドパネルの状態を取得
export function getSidePanelState(windowId) {
  return sidePanelState.get(windowId) || false;
}

// サイドパネルの状態を設定
export function setSidePanelState(windowId, state) {
  sidePanelState.set(windowId, state);
}

// ウィンドウの状態をクリア
export function clearWindowState(windowId) {
  sidePanelState.delete(windowId);
  lastExecutionTime.delete(windowId);
  isProcessing.delete(windowId);
}
