// メニューの開閉
export function toggleMenu(menuContainer) {
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
    const menuWidth = 90; // メニューの幅
    let top = btnRect.bottom + 4;
    let left = btnRect.right - menuWidth;

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
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    menuDropdown.style.top = `${top}px`;
    menuDropdown.style.left = `${left}px`;
  }
}

// 全てのメニューを閉じる
export function closeAllMenus() {
  document.querySelectorAll('.menu-container.open').forEach(menu => {
    menu.classList.remove('open', 'open-upward');
  });
}

// メニューイベントリスナーを初期化
export function initMenuListeners() {
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
}
