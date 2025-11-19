// 編集中のプリセットIDを保存
let editingPresetId = null;

export function getEditingPresetId() {
  return editingPresetId;
}

export function setEditingPresetId(id) {
  editingPresetId = id;
}

// ビュー切り替え
export function showMainView() {
  document.getElementById('mainView').style.display = 'block';
  document.getElementById('editView').style.display = 'none';
  document.getElementById('settingsView').style.display = 'none';
  editingPresetId = null;
}

export function showEditView() {
  document.getElementById('mainView').style.display = 'none';
  document.getElementById('editView').style.display = 'block';
  document.getElementById('settingsView').style.display = 'none';
}

export function showSettingsView() {
  document.getElementById('mainView').style.display = 'none';
  document.getElementById('editView').style.display = 'none';
  document.getElementById('settingsView').style.display = 'block';
}
