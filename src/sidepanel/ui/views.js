// 編集中のプリセットIDを保存
let editingPresetId = null;

export function getEditingPresetId() {
  return editingPresetId;
}

export function setEditingPresetId(id) {
  editingPresetId = id;
}

// DOM要素を安全に取得
function getViewElements() {
  const mainView = document.getElementById('mainView');
  const editView = document.getElementById('editView');
  const settingsView = document.getElementById('settingsView');

  if (!mainView || !editView || !settingsView) {
    console.error('Required DOM elements not found');
    return null;
  }

  return { mainView, editView, settingsView };
}

// ビュー切り替え
export function showMainView() {
  const views = getViewElements();
  if (!views) return;

  views.mainView.style.display = 'block';
  views.editView.style.display = 'none';
  views.settingsView.style.display = 'none';
  editingPresetId = null;
}

export function showEditView() {
  const views = getViewElements();
  if (!views) return;

  views.mainView.style.display = 'none';
  views.editView.style.display = 'block';
  views.settingsView.style.display = 'none';
}

export function showSettingsView() {
  const views = getViewElements();
  if (!views) return;

  views.mainView.style.display = 'none';
  views.editView.style.display = 'none';
  views.settingsView.style.display = 'block';
}
