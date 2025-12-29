import { showMainView } from './ui/views.js';
import { showMessage } from './ui/messages.js';
import { loadSettings, saveSettings, loadIncludePrimarySetting, saveIncludePrimarySetting } from './services/storage.js';
import { isCalendarTab, getActiveTab, sendMessageToTab } from './services/tabs.js';
import { initMenuListeners } from './components/menu.js';
import { renderPresets } from './components/preset-list.js';
import {
  savePreset,
  editPreset,
  updatePreset,
  cancelEditView,
  applyPreset,
  deletePreset
} from './services/preset.js';
import { getMessage, translatePage } from '../shared/i18n.js';

// 全て選択
async function selectAll() {
  if (!await isCalendarTab()) {
    showMessage(getMessage('msgOpenGoogleCalendar'), 'error');
    return;
  }

  const tab = await getActiveTab();

  try {
    await sendMessageToTab(tab.id, {
      action: 'selectAll'
    });
    showMessage(getMessage('msgAllSelected'), 'success');
  } catch (error) {
    console.error('Error selecting all:', error);
    showMessage(getMessage('msgOperationFailed'), 'error');
  }
}

// 全て解除
async function deselectAll() {
  if (!await isCalendarTab()) {
    showMessage(getMessage('msgOpenGoogleCalendar'), 'error');
    return;
  }

  const tab = await getActiveTab();
  const includePrimary = document.getElementById('includePrimary').checked;

  try {
    await sendMessageToTab(tab.id, {
      action: 'deselectAll',
      includePrimary: includePrimary
    });
    showMessage(getMessage('msgAllDeselected'), 'success');
  } catch (error) {
    console.error('Error deselecting all:', error);
    showMessage(getMessage('msgOperationFailed'), 'error');
  }
}

// 設定画面を開く
async function openSettings() {
  const settings = await loadSettings();

  document.getElementById('saveViewTypeByDefault').checked = settings.saveViewTypeByDefault ?? true;
  document.getElementById('applyViewTypeByDefault').checked = settings.applyViewTypeByDefault ?? true;

  // ビューを切り替え
  document.getElementById('mainView').style.display = 'none';
  document.getElementById('editView').style.display = 'none';
  document.getElementById('settingsView').style.display = 'block';
}

// 設定を保存
async function saveSettingsFromUI() {
  const settings = {
    saveViewTypeByDefault: document.getElementById('saveViewTypeByDefault').checked,
    applyViewTypeByDefault: document.getElementById('applyViewTypeByDefault').checked
  };

  await saveSettings(settings);

  const messageEl = document.getElementById('settingsMessage');
  messageEl.textContent = getMessage('msgSettingsSaved');
  messageEl.className = 'message success';
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}

// チェックボックスの変更を保存
async function handleIncludePrimaryChange() {
  const includePrimary = document.getElementById('includePrimary').checked;
  await saveIncludePrimarySetting(includePrimary);
}

// 初期化
async function init() {
  // ページを翻訳
  translatePage();

  // プリセット一覧を表示
  await renderPresets(editPreset, deletePreset, applyPreset);

  // includePrimary設定を読み込み
  const includePrimary = await loadIncludePrimarySetting();
  document.getElementById('includePrimary').checked = includePrimary;

  // メニューリスナーを初期化
  initMenuListeners();

  // メインビュー
  document.getElementById('savePreset').addEventListener('click', savePreset);
  document.getElementById('selectAll').addEventListener('click', selectAll);
  document.getElementById('deselectAll').addEventListener('click', deselectAll);

  // 編集ビュー
  document.getElementById('backToMain').addEventListener('click', () => showMainView());
  document.getElementById('updatePreset').addEventListener('click', updatePreset);
  document.getElementById('cancelEditView').addEventListener('click', cancelEditView);

  // 設定ビュー
  document.getElementById('openSettings').addEventListener('click', openSettings);
  document.getElementById('backToMainFromSettings').addEventListener('click', () => showMainView());
  document.getElementById('saveSettings').addEventListener('click', saveSettingsFromUI);

  // チェックボックスの変更を保存
  document.getElementById('includePrimary').addEventListener('change', handleIncludePrimaryChange);

  // Enterキーで保存
  document.getElementById('presetName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      savePreset();
    }
  });

  // 編集ビューでEnterキーで更新
  document.getElementById('editPresetName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      updatePreset();
    }
  });
}

// DOMContentLoaded イベントで初期化
document.addEventListener('DOMContentLoaded', init);
