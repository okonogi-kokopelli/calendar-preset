import { DEFAULT_SETTINGS, DEFAULT_INCLUDE_PRIMARY } from '../../shared/constants.js';

// グローバル設定を読み込み
export async function loadSettings() {
  const { settings = DEFAULT_SETTINGS } =
    await chrome.storage.local.get('settings');
  return settings;
}

// グローバル設定を保存
export async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
}

// プリセット一覧を取得
export async function loadPresets() {
  const { presets = {} } = await chrome.storage.local.get('presets');
  return presets;
}

// プリセットを保存
export async function savePresets(presets) {
  await chrome.storage.local.set({ presets });
}

// includePrimary設定を保存
export async function saveIncludePrimarySetting(includePrimary) {
  await chrome.storage.local.set({ includePrimary });
}

// includePrimary設定を読み込み
export async function loadIncludePrimarySetting() {
  const { includePrimary = DEFAULT_INCLUDE_PRIMARY } = await chrome.storage.local.get('includePrimary');
  return includePrimary;
}
