// メッセージ表示用ヘルパー
export function showMessage(text, type = 'info', isEditView = false) {
  const messageEl = document.getElementById(isEditView ? 'editMessage' : 'message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}
