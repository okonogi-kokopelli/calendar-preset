import { sanitizeInput } from '../utils/sanitize.js';
import { showMessage } from '../ui/messages.js';
import { showMainView, showEditView, setEditingPresetId, getEditingPresetId } from '../ui/views.js';
import { loadSettings, loadPresets, savePresets } from './storage.js';
import { isCalendarTab, getActiveTab, sendMessageToTab } from './tabs.js';
import { renderPresets } from '../components/preset-list.js';
import { CALENDAR_INIT_DELAY_MS } from '../../shared/constants.js';
import { waitForPageTransition } from '../utils/page-transition.js';
import { getMessage, getViewTypeLabel, isJapanese } from '../../shared/i18n.js';

// プリセット保存
export async function savePreset() {
  const rawPresetName = document.getElementById('presetName').value.trim();
  const presetName = sanitizeInput(rawPresetName);

  if (!presetName) {
    showMessage(getMessage('msgEnterPresetName'), 'error');
    return;
  }

  if (!await isCalendarTab()) {
    showMessage(getMessage('msgOpenGoogleCalendar'), 'error');
    return;
  }

  const tab = await getActiveTab();

  try {
    // グローバル設定を読み込み
    const settings = await loadSettings();

    const response = await sendMessageToTab(tab.id, { action: 'getCurrentState' });

    if (!response || !response.calendars) {
      showMessage(getMessage('msgFailedToGetCalendar'), 'error');
      return;
    }

    const presets = await loadPresets();
    const presetId = Date.now().toString();

    // 新しいプリセットの順序を最後に設定
    const maxOrder = Object.values(presets).reduce((max, preset) => {
      return Math.max(max, preset.order ?? -1);
    }, -1);

    // グローバル設定に応じて viewType を保存
    const viewType = settings.saveViewTypeByDefault ? response.viewType : null;

    presets[presetId] = {
      name: presetName,
      calendars: response.calendars,
      viewType: viewType,
      saveViewType: settings.saveViewTypeByDefault,
      applyViewType: settings.applyViewTypeByDefault,
      createdAt: new Date().toISOString(),
      order: maxOrder + 1
    };

    await savePresets(presets);

    document.getElementById('presetName').value = '';
    showMessage(getMessage('msgPresetSaved', presetName), 'success');
    await renderPresets(editPreset, deletePreset, applyPreset);
  } catch (error) {
    console.error('Error saving preset:', error);
    showMessage(getMessage('msgSaveFailed'), 'error');
  }
}

// プリセット編集
export async function editPreset(presetId) {
  if (!await isCalendarTab()) {
    showMessage(getMessage('msgOpenGoogleCalendar'), 'error');
    return;
  }

  const presets = await loadPresets();
  const preset = presets[presetId];

  if (!preset) {
    showMessage(getMessage('msgPresetNotFound'), 'error');
    return;
  }

  const tab = await getActiveTab();

  try {
    // プリセットを適用
    await sendMessageToTab(tab.id, {
      action: 'applyPreset',
      calendars: preset.calendars
    });

    // 編集モードに設定
    setEditingPresetId(presetId);

    // 編集ビューに情報を設定
    document.getElementById('editPresetName').value = preset.name;

    // プリセット情報を表示（安全にDOM要素を作成）
    const editPresetInfo = document.getElementById('editPresetInfo');
    editPresetInfo.textContent = ''; // クリア

    // ロケールに応じた日付フォーマット
    const locale = isJapanese() ? 'ja-JP' : 'en-US';
    const createdDate = new Date(preset.createdAt).toLocaleString(locale);

    const createdP = document.createElement('p');
    createdP.textContent = getMessage('createdAt', createdDate);
    createdP.style.margin = '0 0 4px 0';
    editPresetInfo.appendChild(createdP);

    if (preset.updatedAt) {
      const updatedDate = new Date(preset.updatedAt).toLocaleString(locale);
      const updatedP = document.createElement('p');
      updatedP.textContent = getMessage('updatedAt', updatedDate);
      updatedP.style.margin = '0 0 4px 0';
      editPresetInfo.appendChild(updatedP);
    }

    const countP = document.createElement('p');
    countP.textContent = getMessage('calendarCount', preset.calendars.length.toString());
    countP.style.margin = '0 0 4px 0';
    editPresetInfo.appendChild(countP);

    // 保存されている表示形式を表示
    const viewTypeP = document.createElement('p');
    if (preset.viewType) {
      const viewTypeName = getViewTypeLabel(preset.viewType);
      viewTypeP.textContent = getMessage('viewTypeLabel', viewTypeName);
    } else {
      viewTypeP.textContent = getMessage('viewTypeLabel', '-');
    }
    viewTypeP.style.margin = '0';
    editPresetInfo.appendChild(viewTypeP);

    // 現在の viewType を取得して表示
    const response = await sendMessageToTab(tab.id, { action: 'getCurrentState' });
    const currentViewTypeName = response.viewType ? getViewTypeLabel(response.viewType) : '-';
    document.getElementById('currentViewType').textContent = currentViewTypeName;

    // セレクトボックスの初期値をプリセットに保存されている viewType に設定
    const editViewTypeSelect = document.getElementById('editViewType');
    if (!editViewTypeSelect) {
      console.error('editViewType select not found');
      return;
    }
    editViewTypeSelect.value = preset.viewType || '';

    // チェックボックスの初期値を設定
    const applyViewTypeCheckbox = document.getElementById('applyViewTypeForPreset');
    if (!applyViewTypeCheckbox) {
      console.error('applyViewTypeForPreset checkbox not found');
      return;
    }
    applyViewTypeCheckbox.checked = preset.applyViewType ?? true;

    // 編集ビューを表示
    showEditView();
    showMessage(getMessage('msgPresetApplied', preset.name), 'success', true);
  } catch (error) {
    console.error('Error editing preset:', error);
    showMessage(getMessage('msgEditFailed'), 'error');
  }
}

// プリセット更新
export async function updatePreset() {
  const rawPresetName = document.getElementById('editPresetName').value.trim();
  const presetName = sanitizeInput(rawPresetName);

  if (!presetName) {
    showMessage(getMessage('msgEnterPresetName'), 'error', true);
    return;
  }

  if (!await isCalendarTab()) {
    showMessage(getMessage('msgOpenGoogleCalendar'), 'error', true);
    return;
  }

  const tab = await getActiveTab();

  try {
    // セレクトボックスから表示形式を取得
    const editViewTypeSelect = document.getElementById('editViewType');
    if (!editViewTypeSelect) {
      console.error('editViewType select not found');
      return;
    }
    const selectedViewType = editViewTypeSelect.value;
    const applyViewTypeCheckbox = document.getElementById('applyViewTypeForPreset');
    if (!applyViewTypeCheckbox) {
      console.error('applyViewTypeForPreset checkbox not found');
      return;
    }
    const applyViewType = applyViewTypeCheckbox.checked;

    const response = await sendMessageToTab(tab.id, { action: 'getCurrentState' });

    if (!response || !response.calendars) {
      showMessage(getMessage('msgFailedToGetCalendar'), 'error', true);
      return;
    }

    const presets = await loadPresets();
    const editingId = getEditingPresetId();

    if (!presets[editingId]) {
      showMessage(getMessage('msgPresetNotFound'), 'error', true);
      return;
    }

    // セレクトボックスの値を viewType として使用（空文字の場合は null）
    const viewType = selectedViewType || null;

    // 既存のプリセットを更新
    presets[editingId] = {
      name: presetName,
      calendars: response.calendars,
      viewType: viewType,
      saveViewType: viewType !== null,
      applyViewType: applyViewType,
      createdAt: presets[editingId].createdAt,
      updatedAt: new Date().toISOString(),
      order: presets[editingId].order ?? 0
    };

    await savePresets(presets);

    showMessage(getMessage('msgPresetUpdated', presetName), 'success');
    showMainView();
    await renderPresets(editPreset, deletePreset, applyPreset);
  } catch (error) {
    console.error('Error updating preset:', error);
    showMessage(getMessage('msgUpdateFailed'), 'error', true);
  }
}

// 編集キャンセル
export function cancelEditView() {
  showMainView();
  showMessage(getMessage('msgEditCancelled'), 'info');
}

// プリセット適用
export async function applyPreset(presetId, buttonElement) {
  if (!await isCalendarTab()) {
    showMessage(getMessage('msgOpenGoogleCalendar'), 'error');
    return;
  }

  const presets = await loadPresets();
  const preset = presets[presetId];

  if (!preset) {
    showMessage(getMessage('msgPresetNotFound'), 'error');
    return;
  }

  // ボタンをローディング状態にする
  const originalText = buttonElement.textContent;
  buttonElement.textContent = getMessage('msgApplying');
  buttonElement.disabled = true;
  buttonElement.classList.add('loading');

  const tab = await getActiveTab();

  try {
    // 表示形式を切り替えるか判定
    // 優先順位: プリセット個別設定 > グローバル設定
    const settings = await loadSettings();
    const shouldApplyViewType = preset.applyViewType ?? settings.applyViewTypeByDefault;

    // ========================================
    // 表示形式の切り替え処理
    // ========================================
    // viewType が保存されていて、かつ切り替え設定がONの場合
    if (preset.viewType && shouldApplyViewType) {
      // 現在のURLから新しいURLを構築
      const currentUrl = tab.url;
      const urlParts = currentUrl.split('/r/');

      if (urlParts.length >= 2) {
        const baseUrl = urlParts[0] + '/r/';
        const newUrl = baseUrl + preset.viewType;

        // URLが異なる場合のみ、表示形式を変更
        if (currentUrl !== newUrl) {
          const result = await waitForPageTransition(tab, currentUrl, newUrl, preset.viewType);

          if (!result.success) {
            showMessage(getMessage('msgViewTypeChangeCancelled'), 'info');
            return; // カレンダー適用をスキップして終了
          }
        }
      }

      // ========================================
      // ステップ5: カレンダー状態を適用
      // ========================================
      // ページ読み込みが完了したが、Googleカレンダーのスクリプトが完全に初期化されるまで少し待つ
      await new Promise(resolve => setTimeout(resolve, CALENDAR_INIT_DELAY_MS));

      // カレンダーを適用
      await sendMessageToTab(tab.id, {
        action: 'applyPreset',
        calendars: preset.calendars
      });
    } else {
      // ========================================
      // 表示形式の切り替えなし
      // ========================================
      // 表示形式の切り替えが不要な場合は、カレンダーのみ適用
      await sendMessageToTab(tab.id, {
        action: 'applyPreset',
        calendars: preset.calendars
      });
    }

    showMessage(getMessage('msgPresetApplied', preset.name), 'success');
  } catch (error) {
    console.error('Error applying preset:', error);
    showMessage(getMessage('msgApplyFailed'), 'error');
  } finally {
    // ボタンを元に戻す
    buttonElement.textContent = originalText;
    buttonElement.disabled = false;
    buttonElement.classList.remove('loading');
  }
}

// プリセット削除
export async function deletePreset(presetId) {
  if (!confirm(getMessage('msgConfirmDelete'))) {
    return;
  }

  const presets = await loadPresets();
  const presetName = presets[presetId]?.name;

  delete presets[presetId];
  await savePresets(presets);

  showMessage(getMessage('msgPresetDeleted', presetName), 'success');
  await renderPresets(editPreset, deletePreset, applyPreset);
}
