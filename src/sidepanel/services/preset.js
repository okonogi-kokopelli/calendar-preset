import { sanitizeInput } from '../utils/sanitize.js';
import { showMessage } from '../ui/messages.js';
import { showMainView, showEditView, setEditingPresetId, editingPresetId } from '../ui/views.js';
import { loadSettings, loadPresets, savePresets } from './storage.js';
import { isCalendarTab, getActiveTab, sendMessageToTab } from './tabs.js';
import { renderPresets } from '../components/preset-list.js';
import { viewTypeLabels } from '../constants.js';

// プリセット保存
export async function savePreset() {
  const rawPresetName = document.getElementById('presetName').value.trim();
  const presetName = sanitizeInput(rawPresetName);

  if (!presetName) {
    showMessage('プリセット名を入力してください', 'error');
    return;
  }

  if (!await isCalendarTab()) {
    showMessage('Googleカレンダーのページで実行してください', 'error');
    return;
  }

  const tab = await getActiveTab();

  try {
    // グローバル設定を読み込み
    const settings = await loadSettings();

    const response = await sendMessageToTab(tab.id, { action: 'getCurrentState' });

    if (!response || !response.calendars) {
      showMessage('カレンダー情報を取得できませんでした', 'error');
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
    showMessage(`プリセット「${presetName}」を保存しました`, 'success');
    await renderPresets(editPreset, deletePreset, applyPreset);
  } catch (error) {
    console.error('Error saving preset:', error);
    showMessage('保存に失敗しました。ページを再読み込みしてください', 'error');
  }
}

// プリセット編集
export async function editPreset(presetId) {
  if (!await isCalendarTab()) {
    showMessage('Googleカレンダーのページで実行してください', 'error');
    return;
  }

  const presets = await loadPresets();
  const preset = presets[presetId];

  if (!preset) {
    showMessage('プリセットが見つかりません', 'error');
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

    const createdDate = new Date(preset.createdAt).toLocaleString('ja-JP');

    const createdP = document.createElement('p');
    createdP.textContent = `作成日時: ${createdDate}`;
    createdP.style.margin = '0 0 4px 0';
    editPresetInfo.appendChild(createdP);

    if (preset.updatedAt) {
      const updatedDate = new Date(preset.updatedAt).toLocaleString('ja-JP');
      const updatedP = document.createElement('p');
      updatedP.textContent = `最終更新: ${updatedDate}`;
      updatedP.style.margin = '0 0 4px 0';
      editPresetInfo.appendChild(updatedP);
    }

    const countP = document.createElement('p');
    countP.textContent = `登録カレンダー数: ${preset.calendars.length}個`;
    countP.style.margin = '0 0 4px 0';
    editPresetInfo.appendChild(countP);

    // 保存されている表示形式を表示
    const viewTypeP = document.createElement('p');
    if (preset.viewType) {
      const viewTypeName = viewTypeLabels[preset.viewType] || preset.viewType;
      viewTypeP.textContent = `表示形式: ${viewTypeName}`;
    } else {
      viewTypeP.textContent = '表示形式: -';
    }
    viewTypeP.style.margin = '0';
    editPresetInfo.appendChild(viewTypeP);

    // 現在の viewType を取得して表示
    const response = await sendMessageToTab(tab.id, { action: 'getCurrentState' });
    const currentViewTypeName = response.viewType ? viewTypeLabels[response.viewType] : '-';
    document.getElementById('currentViewType').textContent = currentViewTypeName;

    // チェックボックスの初期値を設定
    document.getElementById('saveViewTypeForPreset').checked = preset.saveViewType ?? true;
    document.getElementById('applyViewTypeForPreset').checked = preset.applyViewType ?? true;

    // 編集ビューを表示
    showEditView();
    showMessage(`プリセット「${preset.name}」を適用しました`, 'success', true);
  } catch (error) {
    console.error('Error editing preset:', error);
    showMessage('編集に失敗しました。ページを再読み込みしてください', 'error');
  }
}

// プリセット更新
export async function updatePreset() {
  const rawPresetName = document.getElementById('editPresetName').value.trim();
  const presetName = sanitizeInput(rawPresetName);

  if (!presetName) {
    showMessage('プリセット名を入力してください', 'error', true);
    return;
  }

  if (!await isCalendarTab()) {
    showMessage('Googleカレンダーのページで実行してください', 'error', true);
    return;
  }

  const tab = await getActiveTab();

  try {
    // プリセット個別設定を読み取り
    const saveViewType = document.getElementById('saveViewTypeForPreset').checked;
    const applyViewType = document.getElementById('applyViewTypeForPreset').checked;

    const response = await sendMessageToTab(tab.id, { action: 'getCurrentState' });

    if (!response || !response.calendars) {
      showMessage('カレンダー情報を取得できませんでした', 'error', true);
      return;
    }

    const presets = await loadPresets();

    if (!presets[editingPresetId]) {
      showMessage('プリセットが見つかりません', 'error', true);
      return;
    }

    // 個別設定に応じて viewType を保存
    const viewType = saveViewType ? response.viewType : presets[editingPresetId].viewType;

    // 既存のプリセットを更新
    presets[editingPresetId] = {
      name: presetName,
      calendars: response.calendars,
      viewType: viewType,
      saveViewType: saveViewType,
      applyViewType: applyViewType,
      createdAt: presets[editingPresetId].createdAt,
      updatedAt: new Date().toISOString(),
      order: presets[editingPresetId].order ?? 0
    };

    await savePresets(presets);

    showMessage(`プリセット「${presetName}」を更新しました`, 'success');
    showMainView();
    await renderPresets(editPreset, deletePreset, applyPreset);
  } catch (error) {
    console.error('Error updating preset:', error);
    showMessage('更新に失敗しました', 'error', true);
  }
}

// 編集キャンセル
export function cancelEditView() {
  showMainView();
  showMessage('編集をキャンセルしました', 'info');
}

// プリセット適用
export async function applyPreset(presetId, buttonElement) {
  if (!await isCalendarTab()) {
    showMessage('Googleカレンダーのページで実行してください', 'error');
    return;
  }

  const presets = await loadPresets();
  const preset = presets[presetId];

  if (!preset) {
    showMessage('プリセットが見つかりません', 'error');
    return;
  }

  // ボタンをローディング状態にする
  const originalText = buttonElement.textContent;
  buttonElement.textContent = '適用中...';
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
          // ========================================
          // ステップ1: ページ遷移を開始
          // ========================================
          // chrome.tabs.update()を使用してURLを変更
          // （content scriptからの遷移ではないため、警告が出にくい）
          await chrome.tabs.update(tab.id, { url: newUrl });

          // ========================================
          // ステップ2: URLが実際に変わるまで待つ
          // ========================================
          // chrome.tabs.update()を呼んでも、実際にURLが変わるまでに時間がかかる
          // また、「このサイトを離れますか？」のダイアログでユーザーが決断するまで時間がかかる場合がある
          // そのため、URLが変わったことを確認するまでポーリング
          const maxAttempts = 50; // 最大10秒待機（200ms × 50回）
          let urlChanged = false;

          for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            const currentTab = await chrome.tabs.get(tab.id);

            // URL変更を検知
            if (currentTab.url.includes(preset.viewType)) {
              urlChanged = true;
              break; // URL変更を検知したらループを抜ける
            }

            // 早期キャンセル検知（2秒経過後）
            // URLが変わらず、かつページが完了状態（complete）の場合、キャンセルされた可能性が高い
            if (i >= 10 && // 2秒経過（200ms × 10）
                currentTab.url === currentUrl && // URLが元のまま
                currentTab.status === 'complete') { // ページは完了状態
              break; // キャンセルと判断して早期終了
            }
          }

          // URLが変わらなかった場合 = ページ遷移がキャンセルされた
          if (!urlChanged) {
            showMessage('表示形式の変更がキャンセルされました', 'info');
            return; // カレンダー適用をスキップして終了
          }

          // ========================================
          // ステップ3: ページ読み込み完了を待つ
          // ========================================
          // URLは変わったが、ページの読み込みが完了するまで待つ必要がある
          // タイムアウト付きでページ読み込み完了を待機（レースコンディション対策）
          const loadResult = await new Promise((resolve) => {
            let finished = false;
            let listener = null;

            const timeoutId = setTimeout(() => {
              if (!finished) {
                finished = true;
                if (listener) chrome.tabs.onUpdated.removeListener(listener);
                resolve('timeout');
              }
            }, 5000);

            listener = (tabId, changeInfo, updatedTab) => {
              if (tabId === tab.id && changeInfo.status === 'complete') {
                if (!finished) {
                  finished = true;
                  chrome.tabs.onUpdated.removeListener(listener);
                  clearTimeout(timeoutId);
                  resolve('complete');
                }
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
          });

          // タイムアウトした場合、追加で待機
          if (loadResult === 'timeout') {

            // タイムアウト後も追加で待機（ユーザーが遅れて「離れる」をクリックした場合に対応）
            // 最大10秒間、200msごとにポーリングでページ遷移完了を確認
            const maxPostTimeoutChecks = 50; // 10秒（200ms × 50）
            for (let i = 0; i < maxPostTimeoutChecks; i++) {
              await new Promise(resolve => setTimeout(resolve, 200));
              const currentTab = await chrome.tabs.get(tab.id);

              // ページ遷移が完了したか確認（URLが変わって、読み込み完了）
              if (currentTab.url.includes(preset.viewType) &&
                  currentTab.status === 'complete') {
                break; // 遷移完了を検知してループを抜ける
              }
            }
          }

          // ========================================
          // ステップ4: 最終確認
          // ========================================
          // タイムアウト後も、URLが本当に変わったか最終確認
          // （遅延してキャンセルされた場合に備えて）
          const updatedTab = await chrome.tabs.get(tab.id);
          if (!updatedTab.url.includes(preset.viewType)) {
            showMessage('表示形式の変更がキャンセルされました', 'info');
            return; // カレンダー適用をスキップして終了
          }
        }
      }

      // ========================================
      // ステップ5: カレンダー状態を適用
      // ========================================
      // ページ読み込みが完了したが、Googleカレンダーのスクリプトが完全に初期化されるまで少し待つ
      await new Promise(resolve => setTimeout(resolve, 1000));

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

    showMessage(`プリセット「${preset.name}」を適用しました`, 'success');
  } catch (error) {
    console.error('Error applying preset:', error);
    showMessage('適用に失敗しました。ページを再読み込みしてください', 'error');
  } finally {
    // ボタンを元に戻す
    buttonElement.textContent = originalText;
    buttonElement.disabled = false;
    buttonElement.classList.remove('loading');
  }
}

// プリセット削除
export async function deletePreset(presetId) {
  if (!confirm('このプリセットを削除しますか？')) {
    return;
  }

  const presets = await loadPresets();
  const presetName = presets[presetId]?.name;

  delete presets[presetId];
  await savePresets(presets);

  showMessage(`プリセット「${presetName}」を削除しました`, 'success');
  await renderPresets(editPreset, deletePreset, applyPreset);
}
