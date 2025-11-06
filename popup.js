// 入力サニタイズ関数
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  // HTMLタグを除去
  const div = document.createElement('div');
  div.textContent = input;
  let sanitized = div.innerHTML;

  // さらに特殊文字をエスケープ
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // 最大文字数制限（プリセット名は100文字まで）
  return sanitized.substring(0, 100).trim();
}

// メッセージ表示用ヘルパー
function showMessage(text, type = 'info', isEditView = false) {
  const messageEl = document.getElementById(isEditView ? 'editMessage' : 'message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}

// ビュー切り替え
function showMainView() {
  document.getElementById('mainView').style.display = 'block';
  document.getElementById('editView').style.display = 'none';
  editingPresetId = null;
}

function showEditView() {
  document.getElementById('mainView').style.display = 'none';
  document.getElementById('editView').style.display = 'block';
}

// カレンダータブかチェック
async function isCalendarTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab && tab.url && tab.url.includes('calendar.google.com');
}

// 編集中のプリセットIDを保存
let editingPresetId = null;

// ドラッグ&ドロップの状態管理
let draggedElement = null;

// プリセット一覧を表示
async function renderPresets() {
  const { presets = {} } = await chrome.storage.local.get('presets');
  const presetList = document.getElementById('presetList');

  if (Object.keys(presets).length === 0) {
    presetList.textContent = '';
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'empty-message';
    emptyMsg.textContent = 'プリセットがありません';
    presetList.appendChild(emptyMsg);
    return;
  }

  presetList.textContent = '';

  // プリセットを順序でソート
  const sortedPresets = Object.entries(presets).sort((a, b) => {
    const orderA = a[1].order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b[1].order ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  for (const [id, preset] of sortedPresets) {
    const presetItem = document.createElement('div');
    presetItem.className = 'preset-item';
    presetItem.draggable = true;
    presetItem.dataset.presetId = id;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'preset-name';
    nameSpan.textContent = preset.name;

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'preset-buttons';

    // 適用ボタン
    const applyBtn = document.createElement('button');
    applyBtn.textContent = '適用';
    applyBtn.className = 'apply-btn';
    applyBtn.onclick = () => applyPreset(id);

    // メニューボタンのコンテナ
    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';

    // メニューボタン（⋮）
    const menuBtn = document.createElement('button');
    menuBtn.textContent = '⋮';
    menuBtn.className = 'menu-btn';
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      toggleMenu(menuContainer);
    };

    // ドロップダウンメニュー
    const menuDropdown = document.createElement('div');
    menuDropdown.className = 'menu-dropdown';

    const editMenuItem = document.createElement('div');
    editMenuItem.className = 'menu-item';
    const editIcon = document.createElement('span');
    editIcon.className = 'menu-icon';
    editIcon.textContent = '✏️';
    const editText = document.createElement('span');
    editText.textContent = '編集';
    editMenuItem.appendChild(editIcon);
    editMenuItem.appendChild(editText);
    editMenuItem.onclick = () => {
      closeAllMenus();
      editPreset(id);
    };

    const deleteMenuItem = document.createElement('div');
    deleteMenuItem.className = 'menu-item delete-menu-item';
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'menu-icon';
    deleteIcon.textContent = '🗑️';
    const deleteText = document.createElement('span');
    deleteText.textContent = '削除';
    deleteMenuItem.appendChild(deleteIcon);
    deleteMenuItem.appendChild(deleteText);
    deleteMenuItem.onclick = () => {
      closeAllMenus();
      deletePreset(id);
    };

    menuDropdown.appendChild(editMenuItem);
    menuDropdown.appendChild(deleteMenuItem);

    menuContainer.appendChild(menuBtn);
    menuContainer.appendChild(menuDropdown);

    buttonsDiv.appendChild(applyBtn);
    buttonsDiv.appendChild(menuContainer);

    presetItem.appendChild(nameSpan);
    presetItem.appendChild(buttonsDiv);

    // ドラッグイベントリスナーを追加
    presetItem.addEventListener('dragstart', handleDragStart);
    presetItem.addEventListener('dragover', handleDragOver);
    presetItem.addEventListener('drop', handleDrop);
    presetItem.addEventListener('dragend', handleDragEnd);
    presetItem.addEventListener('dragenter', handleDragEnter);
    presetItem.addEventListener('dragleave', handleDragLeave);

    presetList.appendChild(presetItem);
  }
}

// ドラッグ&ドロップイベントハンドラ
function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';

  if (this !== draggedElement) {
    // ドラッグ中の要素の直前・直後かチェック
    const isDraggedPrev = this.nextElementSibling === draggedElement;
    const isDraggedNext = this.previousElementSibling === draggedElement;

    // マウスの位置を取得
    const rect = this.getBoundingClientRect();
    const threshold = rect.height * 0.3; // 上下30%の範囲
    const mouseY = e.clientY - rect.top;

    // マウスが要素の上30%にあるか、下30%にあるかで判定
    this.classList.remove('drag-over-top', 'drag-over-bottom');

    let showTop = false;
    let showBottom = false;

    if (mouseY < threshold) {
      showTop = true;
    } else if (mouseY > rect.height - threshold) {
      showBottom = true;
    } else {
      // 中央40%の範囲では、より近い方を選択
      const midPoint = rect.height / 2;
      if (mouseY < midPoint) {
        showTop = true;
      } else {
        showBottom = true;
      }
    }

    // ドラッグ中の要素の直後の要素の上部にはラインを表示しない
    if (showTop && isDraggedNext) {
      showTop = false;
    }

    // ドラッグ中の要素の直前の要素の下部にはラインを表示しない
    if (showBottom && isDraggedPrev) {
      showBottom = false;
    }

    if (showTop) {
      this.classList.add('drag-over-top');
    } else if (showBottom) {
      this.classList.add('drag-over-bottom');
    }
  }

  return false;
}

function handleDragEnter(e) {
  // dragover で処理するため、ここでは何もしない
}

function handleDragLeave(e) {
  this.classList.remove('drag-over-top', 'drag-over-bottom');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedElement !== this) {
    // drag-over-topまたはdrag-over-bottomクラスに基づいて挿入位置を決定
    const insertBefore = this.classList.contains('drag-over-top');

    if (insertBefore) {
      // 上部ラインが表示されている場合、この要素の前に挿入
      this.parentNode.insertBefore(draggedElement, this);
    } else {
      // 下部ラインが表示されている場合、この要素の後に挿入
      this.parentNode.insertBefore(draggedElement, this.nextSibling);
    }

    // 順序を保存
    savePresetOrder();
  }

  this.classList.remove('drag-over-top', 'drag-over-bottom');
  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');

  // すべてのdrag-overクラスを削除
  document.querySelectorAll('.preset-item').forEach(item => {
    item.classList.remove('drag-over-top', 'drag-over-bottom');
  });
}

// プリセットの順序を保存
async function savePresetOrder() {
  const { presets = {} } = await chrome.storage.local.get('presets');
  const presetList = document.getElementById('presetList');
  const presetItems = presetList.querySelectorAll('.preset-item');

  presetItems.forEach((item, index) => {
    const presetId = item.dataset.presetId;
    if (presets[presetId]) {
      presets[presetId].order = index;
    }
  });

  await chrome.storage.local.set({ presets });
}

// メニューの開閉
function toggleMenu(menuContainer) {
  const isOpen = menuContainer.classList.contains('open');

  // 他の開いているメニューを閉じる
  closeAllMenus();

  if (!isOpen) {
    menuContainer.classList.add('open');

    // メニューの位置を計算
    const menuBtn = menuContainer.querySelector('.menu-btn');
    const menuDropdown = menuContainer.querySelector('.menu-dropdown');
    const btnRect = menuBtn.getBoundingClientRect();

    // メニューのデフォルト位置（下向き、右寄せ）
    let top = btnRect.bottom + 4;
    let left = btnRect.right - 120; // メニューの幅 120px

    // 画面の下端からの余白を確認
    const menuHeight = 80; // メニューの高さ（約）
    const spaceBelow = window.innerHeight - btnRect.bottom;
    const spaceAbove = btnRect.top;

    // 下に十分なスペースがない場合は上に表示
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      top = btnRect.top - menuHeight - 4;
      menuContainer.classList.add('open-upward');
    }

    // 左端に寄せすぎないように調整
    if (left < 8) {
      left = 8;
    }

    // 右端に寄せすぎないように調整
    if (left + 120 > window.innerWidth - 8) {
      left = window.innerWidth - 128;
    }

    menuDropdown.style.top = `${top}px`;
    menuDropdown.style.left = `${left}px`;
  }
}

// 全てのメニューを閉じる
function closeAllMenus() {
  document.querySelectorAll('.menu-container.open').forEach(menu => {
    menu.classList.remove('open', 'open-upward');
  });
}

// メニュー外をクリックしたら閉じる
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-container')) {
    closeAllMenus();
  }
});

// スクロール時にメニューを閉じる
document.addEventListener('scroll', () => {
  closeAllMenus();
}, true); // キャプチャフェーズで全てのスクロールイベントを捕捉

// プリセット保存
async function savePreset() {
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

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCurrentState' });

    if (!response || !response.calendars) {
      showMessage('カレンダー情報を取得できませんでした', 'error');
      return;
    }

    const { presets = {} } = await chrome.storage.local.get('presets');
    const presetId = Date.now().toString();

    // 新しいプリセットの順序を最後に設定
    const maxOrder = Object.values(presets).reduce((max, preset) => {
      return Math.max(max, preset.order ?? -1);
    }, -1);

    presets[presetId] = {
      name: presetName,
      calendars: response.calendars,
      createdAt: new Date().toISOString(),
      order: maxOrder + 1
    };

    await chrome.storage.local.set({ presets });

    document.getElementById('presetName').value = '';
    showMessage(`プリセット「${presetName}」を保存しました`, 'success');
    renderPresets();
  } catch (error) {
    console.error('Error saving preset:', error);
    showMessage('保存に失敗しました。ページを再読み込みしてください', 'error');
  }
}

// プリセット編集
async function editPreset(presetId) {
  if (!await isCalendarTab()) {
    showMessage('Googleカレンダーのページで実行してください', 'error');
    return;
  }

  const { presets = {} } = await chrome.storage.local.get('presets');
  const preset = presets[presetId];

  if (!preset) {
    showMessage('プリセットが見つかりません', 'error');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    // プリセットを適用
    await chrome.tabs.sendMessage(tab.id, {
      action: 'applyPreset',
      calendars: preset.calendars
    });

    // 編集モードに設定
    editingPresetId = presetId;

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
    countP.style.margin = '0';
    editPresetInfo.appendChild(countP);

    // 編集ビューを表示
    showEditView();
    showMessage(`プリセット「${preset.name}」を適用しました`, 'success', true);
  } catch (error) {
    console.error('Error editing preset:', error);
    showMessage('編集に失敗しました。ページを再読み込みしてください', 'error');
  }
}

// プリセット更新
async function updatePreset() {
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

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCurrentState' });

    if (!response || !response.calendars) {
      showMessage('カレンダー情報を取得できませんでした', 'error', true);
      return;
    }

    const { presets = {} } = await chrome.storage.local.get('presets');

    if (!presets[editingPresetId]) {
      showMessage('プリセットが見つかりません', 'error', true);
      return;
    }

    // 既存のプリセットを更新
    presets[editingPresetId] = {
      name: presetName,
      calendars: response.calendars,
      createdAt: presets[editingPresetId].createdAt,
      updatedAt: new Date().toISOString(),
      order: presets[editingPresetId].order ?? 0
    };

    await chrome.storage.local.set({ presets });

    showMessage(`プリセット「${presetName}」を更新しました`, 'success');
    showMainView();
    renderPresets();
  } catch (error) {
    console.error('Error updating preset:', error);
    showMessage('更新に失敗しました', 'error', true);
  }
}

// 編集キャンセル
function cancelEditView() {
  showMainView();
  showMessage('編集をキャンセルしました', 'info');
}

// プリセット適用
async function applyPreset(presetId) {
  if (!await isCalendarTab()) {
    showMessage('Googleカレンダーのページで実行してください', 'error');
    return;
  }

  const { presets = {} } = await chrome.storage.local.get('presets');
  const preset = presets[presetId];

  if (!preset) {
    showMessage('プリセットが見つかりません', 'error');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'applyPreset',
      calendars: preset.calendars
    });

    showMessage(`プリセット「${preset.name}」を適用しました`, 'success');
  } catch (error) {
    console.error('Error applying preset:', error);
    showMessage('適用に失敗しました。ページを再読み込みしてください', 'error');
  }
}

// プリセット削除
async function deletePreset(presetId) {
  if (!confirm('このプリセットを削除しますか？')) {
    return;
  }

  const { presets = {} } = await chrome.storage.local.get('presets');
  const presetName = presets[presetId]?.name;

  delete presets[presetId];
  await chrome.storage.local.set({ presets });

  showMessage(`プリセット「${presetName}」を削除しました`, 'success');
  renderPresets();
}

// 全て選択
async function selectAll() {
  if (!await isCalendarTab()) {
    showMessage('Googleカレンダーのページで実行してください', 'error');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'selectAll'
    });
    showMessage('全てのカレンダーを選択しました', 'success');
  } catch (error) {
    console.error('Error selecting all:', error);
    showMessage('操作に失敗しました', 'error');
  }
}

// 全て解除
async function deselectAll() {
  if (!await isCalendarTab()) {
    showMessage('Googleカレンダーのページで実行してください', 'error');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const includePrimary = document.getElementById('includePrimary').checked;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'deselectAll',
      includePrimary: includePrimary
    });
    showMessage('全てのカレンダーを解除しました', 'success');
  } catch (error) {
    console.error('Error deselecting all:', error);
    showMessage('操作に失敗しました', 'error');
  }
}

// チェックボックスの状態を保存
async function saveIncludePrimarySetting() {
  const includePrimary = document.getElementById('includePrimary').checked;
  await chrome.storage.local.set({ includePrimary });
}

// チェックボックスの状態を読み込み
async function loadIncludePrimarySetting() {
  const { includePrimary = false } = await chrome.storage.local.get('includePrimary');
  document.getElementById('includePrimary').checked = includePrimary;
}

// イベントリスナー設定
document.addEventListener('DOMContentLoaded', async () => {
  renderPresets();
  await loadIncludePrimarySetting();

  // メインビュー
  document.getElementById('savePreset').addEventListener('click', savePreset);
  document.getElementById('selectAll').addEventListener('click', selectAll);
  document.getElementById('deselectAll').addEventListener('click', deselectAll);

  // 編集ビュー
  document.getElementById('backToMain').addEventListener('click', () => showMainView());
  document.getElementById('updatePreset').addEventListener('click', updatePreset);
  document.getElementById('cancelEditView').addEventListener('click', cancelEditView);

  // チェックボックスの変更を保存
  document.getElementById('includePrimary').addEventListener('change', saveIncludePrimarySetting);

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
});
