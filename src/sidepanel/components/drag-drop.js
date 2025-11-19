import { loadPresets, savePresets } from '../services/storage.js';

// ドラッグ&ドロップの閾値設定
const DRAG_THRESHOLD_RATIO = 0.3;  // 上下30%の検出ゾーン（残り中央40%）

// ドラッグ&ドロップの状態管理
let draggedElement = null;

// ドラッグ&ドロップイベントハンドラ
export function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

export function handleDragOver(e) {
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
    const threshold = rect.height * DRAG_THRESHOLD_RATIO;
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

export function handleDragEnter(e) {
  // dragover で処理するため、ここでは何もしない
}

export function handleDragLeave(e) {
  this.classList.remove('drag-over-top', 'drag-over-bottom');
}

export function handleDrop(e) {
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

export function handleDragEnd(e) {
  this.classList.remove('dragging');

  // すべてのdrag-overクラスを削除
  document.querySelectorAll('.preset-item').forEach(item => {
    item.classList.remove('drag-over-top', 'drag-over-bottom');
  });
}

// プリセットの順序を保存
async function savePresetOrder() {
  const presets = await loadPresets();
  const presetList = document.getElementById('presetList');
  const presetItems = presetList.querySelectorAll('.preset-item');

  presetItems.forEach((item, index) => {
    const presetId = item.dataset.presetId;
    if (presets[presetId]) {
      presets[presetId].order = index;
    }
  });

  await savePresets(presets);
}
