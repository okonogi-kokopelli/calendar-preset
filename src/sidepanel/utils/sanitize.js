import { MAX_PRESET_NAME_LENGTH } from '../../shared/constants.js';

// 入力サニタイズ関数
export function sanitizeInput(input) {
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

  // 最大文字数制限
  return sanitized.substring(0, MAX_PRESET_NAME_LENGTH).trim();
}
