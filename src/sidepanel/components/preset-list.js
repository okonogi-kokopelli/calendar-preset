import { loadPresets } from '../services/storage.js';
import { toggleMenu, closeAllMenus } from './menu.js';
import {
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  handleDragEnter,
  handleDragLeave
} from './drag-drop.js';

// プリセット一覧を表示
export async function renderPresets(editPresetCallback, deletePresetCallback, applyPresetCallback) {
  // パラメータ検証（防御的プログラミング）
  if (typeof editPresetCallback !== 'function' ||
      typeof deletePresetCallback !== 'function' ||
      typeof applyPresetCallback !== 'function') {
    console.error('renderPresets: すべてのパラメータは関数である必要があります', {
      editPresetCallback: typeof editPresetCallback,
      deletePresetCallback: typeof deletePresetCallback,
      applyPresetCallback: typeof applyPresetCallback
    });
    return;
  }

  const presets = await loadPresets();
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
    applyBtn.dataset.presetId = id;
    applyBtn.onclick = (e) => applyPresetCallback(id, e.target);

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
      editPresetCallback(id);
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
      deletePresetCallback(id);
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
