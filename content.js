// 実行中フラグ（連続クリック防止）
let isExecuting = false;

// 折りたたまれているカレンダーグループを展開
async function expandAllCalendarGroups() {
  // カレンダーリストのコンテナを探す
  const calendarListContainer = document.querySelector('[role="navigation"]') ||
                                document.querySelector('[data-drawerid]') ||
                                document.querySelector('.YPmRfe') ||
                                document.querySelector('nav') ||
                                document.querySelector('aside');

  if (!calendarListContainer) {
    return;
  }

  // コンテナ内のみで折りたたみ可能なグループを探す
  const collapsedGroups = calendarListContainer.querySelectorAll('[aria-expanded="false"]');

  // カレンダーグループのみ展開（テキストで判定）
  let expandedCount = 0;
  collapsedGroups.forEach((button) => {
    const text = button.textContent?.trim() || button.getAttribute('aria-label') || '';
    const ariaLabel = button.getAttribute('aria-label') || '';

    // カレンダー関連のキーワードを含む場合のみ展開
    const isCalendarGroup = text.includes('カレンダー') ||
                           text.includes('calendar') ||
                           ariaLabel.includes('カレンダー') ||
                           ariaLabel.includes('calendar') ||
                           text.includes('マイ') ||
                           text.includes('My') ||
                           text.includes('他の') ||
                           text.includes('Other');

    if (isCalendarGroup) {
      button.click();
      expandedCount++;
    }
  });

  // 展開後のDOMの更新を待つ
  if (expandedCount > 0) {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// カレンダーリストのコンテナをスクロールして全て読み込む
async function scrollCalendarListContainer() {
  // カレンダーリストのコンテナを探す
  const calendarListContainer = document.querySelector('[role="navigation"]') ||
                                document.querySelector('[data-drawerid]') ||
                                document.querySelector('.YPmRfe') ||
                                document.querySelector('nav') ||
                                document.querySelector('aside');

  if (!calendarListContainer) {
    return;
  }

  // スクロール可能な親要素を探す
  let scrollableElement = calendarListContainer;
  while (scrollableElement && scrollableElement !== document.body) {
    const style = window.getComputedStyle(scrollableElement);
    const overflowY = style.overflowY;
    const hasScroll = scrollableElement.scrollHeight > scrollableElement.clientHeight;

    if ((overflowY === 'auto' || overflowY === 'scroll') && hasScroll) {
      break;
    }

    scrollableElement = scrollableElement.parentElement;
  }

  if (scrollableElement === document.body || !scrollableElement) {
    return;
  }

  // 現在のスクロール位置を保存
  const originalScrollTop = scrollableElement.scrollTop;

  // 最下部までスクロール
  scrollableElement.scrollTop = scrollableElement.scrollHeight;

  // DOMの更新を待つ
  await new Promise(resolve => setTimeout(resolve, 300));

  // 元の位置に戻す
  scrollableElement.scrollTop = originalScrollTop;
}

// カレンダーを全て読み込むための処理
async function ensureAllCalendarsLoaded() {
  // 1. 折りたたまれているグループを展開
  await expandAllCalendarGroups();

  // 2. カレンダーリストをスクロールして仮想スクロールを読み込む
  await scrollCalendarListContainer();

  // 3. 少し待つ
  await new Promise(resolve => setTimeout(resolve, 100));
}

// チェックボックスの状態を設定（イベントも発火）
function setCheckboxState(checkbox, checked) {
  if (checkbox.checked !== checked) {
    checkbox.checked = checked;

    // Googleカレンダーが監視している可能性のあるイベントを発火
    const events = ['change', 'input', 'click'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      checkbox.dispatchEvent(event);
    });
  }
}

// カレンダー名をクリーンアップ
function cleanCalendarName(rawName) {
  if (!rawName) return '';

  let name = rawName;

  // 不要なテキストパターンを削除
  const patterns = [
    /more_vert.*/g,                          // more_vert以降
    /clear.*/g,                              // clear以降
    /「[^」]*」のオーバーフロー メニュー/g,   // オーバーフローメニュー
    /「[^」]*」の登録を解除/g,                // 登録解除
    /\s+/g,                                  // 複数の空白を1つに
  ];

  for (const pattern of patterns) {
    name = name.replace(pattern, ' ');
  }

  // 前後の空白とカッコ内のテキストの整理
  name = name.trim();

  // 空の場合は元の名前から最初の部分を取得
  if (!name || name.length === 0) {
    const match = rawName.match(/^([^\s]+)/);
    name = match ? match[1] : rawName.substring(0, 30);
  }

  return name;
}

// カレンダー名を取得（複数の方法を試す）
function getCalendarName(checkbox) {
  const parent = checkbox.closest('li') || checkbox.closest('div') || checkbox.parentElement;

  // 1. aria-labelを優先
  const ariaLabel = parent?.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.length > 0 && ariaLabel.length < 100) {
    return cleanCalendarName(ariaLabel);
  }

  // 2. チェックボックスの次の要素（ラベルやspan）
  let nextElement = checkbox.nextElementSibling;
  if (nextElement && nextElement.textContent) {
    const text = nextElement.textContent.trim();
    if (text.length > 0 && text.length < 50) {
      return cleanCalendarName(text);
    }
  }

  // 3. 親要素のtextContentからクリーンアップ
  const parentText = parent?.textContent?.trim() || '';
  return cleanCalendarName(parentText);
}

// カレンダーの一意なIDを取得（順序に依存しない）
function getCalendarId(checkbox) {
  // 親要素を遡って様々な属性を探す
  let element = checkbox;
  let maxDepth = 10;

  while (element && maxDepth > 0) {
    // 様々な属性をチェック（Googleカレンダー固有のIDを探す）
    const possibleIds = [
      element.getAttribute('data-id'),
      element.getAttribute('data-calendarid'),
      element.getAttribute('data-calendar-id'),
      element.getAttribute('data-emailaddress'),
      element.getAttribute('data-email'),
      element.getAttribute('id'),
      element.getAttribute('data-key'),
    ];

    for (const id of possibleIds) {
      if (id && id.length > 0) {
        // メールアドレス形式のIDを優先
        if (id.includes('@') || id.includes('.calendar.google.com')) {
          return id;
        }
      }
    }

    // メールアドレス形式でなくても、有効なdata-idがあれば使用
    const dataId = element.getAttribute('data-id');
    if (dataId && dataId.length > 5) {
      return dataId;
    }

    element = element.parentElement;
    maxDepth--;
  }

  // data-idが見つからない場合、カレンダー名をIDとして使用
  const calendarName = getCalendarName(checkbox);
  return `name:${calendarName}`;
}

// カレンダーリストコンテナを取得
function findCalendarListContainer() {
  // 複数のセレクタを試す
  const selectors = [
    '#YPmRfe',                    // カレンダーリストのID
    '.YPmRfe',                    // カレンダーリストのクラス
    '[data-id*="calendar"]',      // data-idにcalendarを含む
    '[aria-label*="calendar"]',   // aria-labelにcalendarを含む
    'nav[role="navigation"]',     // ナビゲーション
    '.gb_g',                      // 旧UI
    'c-wiz > div > div > div'     // 一般的なコンテナ構造
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }

  // サイドバー内を探す
  const sidebar = document.querySelector('[role="complementary"]') ||
                  document.querySelector('aside') ||
                  document.querySelector('#left-nav');

  if (sidebar) {
    return sidebar;
  }

  return document.body;
}

// カレンダーアイテムを検出
function findCalendarItems() {
  const container = findCalendarListContainer();

  // 複数のパターンでカレンダーアイテムを探す
  const itemSelectors = [
    // 標準的な属性
    '[data-id][data-name]',
    '[data-id]',
    '[data-calendarid]',
    // チェックボックスを含む要素の親
    'input[type="checkbox"]:not([id^="search"])',
    '[role="checkbox"]',
    // リンクやボタン
    'a[href*="calendar"]',
    'button[data-id]',
    // リストアイテム
    'li[data-id]',
    'div[data-id]'
  ];

  for (const selector of itemSelectors) {
    let items;

    if (selector.includes('checkbox')) {
      // チェックボックスの場合、親要素を取得
      const checkboxes = container.querySelectorAll(selector);
      items = Array.from(checkboxes).map(cb => {
        return cb.closest('li') || cb.closest('div[data-id]') || cb.parentElement;
      }).filter(el => el);
    } else {
      items = container.querySelectorAll(selector);
    }

    if (items.length > 0) {
      return Array.from(items);
    }
  }

  return [];
}

// カレンダーの状態を取得（チェックされているカレンダーのIDだけ返す）
async function getCurrentState() {
  // 全てのカレンダーを読み込む
  await ensureAllCalendarsLoaded();

  const items = findCalendarItems();
  const checkedCalendarIds = [];

  if (items.length === 0) {
    // 全てのチェックボックスを探す
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

    allCheckboxes.forEach((checkbox, index) => {
      const parent = checkbox.closest('li') || checkbox.closest('div') || checkbox.parentElement;
      const rawText = parent?.textContent?.trim() || '';

      // 検索ボックスやその他のチェックボックスをフィルタリング
      if (rawText && rawText.length > 0 && rawText.length < 200 && !rawText.includes('検索')) {
        const calendarId = getCalendarId(checkbox);
        const calendarName = getCalendarName(checkbox);

        // チェックされているカレンダーのIDだけ追加
        if (calendarId && calendarName && checkbox.checked) {
          checkedCalendarIds.push(calendarId);
        }
      }
    });

    return { calendars: checkedCalendarIds };
  }

  items.forEach((item, index) => {
    // カレンダーIDを取得
    const calendarId = item.getAttribute('data-id') ||
                      item.getAttribute('data-calendarid') ||
                      item.getAttribute('data-calendar-id') ||
                      `calendar-${index}`;

    // チェック状態を取得
    const checkbox = item.querySelector('input[type="checkbox"]') ||
                    item.querySelector('[role="checkbox"]') ||
                    item.querySelector('[type="checkbox"]');

    let isChecked = false;

    if (checkbox) {
      if (checkbox.type === 'checkbox') {
        isChecked = checkbox.checked;
      } else if (checkbox.getAttribute('role') === 'checkbox') {
        isChecked = checkbox.getAttribute('aria-checked') === 'true';
      }
    } else {
      // aria-checkedを直接持つ場合
      isChecked = item.getAttribute('aria-checked') === 'true';
    }

    // チェックされているカレンダーのIDだけ追加
    if (isChecked) {
      checkedCalendarIds.push(calendarId);
    }
  });

  return { calendars: checkedCalendarIds };
}

// カレンダーの状態を適用（段階的スクロール）
// calendarsはチェックするカレンダーIDの配列
async function applyPreset(calendars) {
  if (isExecuting) {
    return;
  }

  isExecuting = true;

  try {
    // グループを展開
    await expandAllCalendarGroups();

    // カレンダーIDのSetに変換（高速検索用）
    const checkedCalendarIds = new Set(calendars);

    // まず1つのカレンダーチェックボックスを見つける
    const sampleCheckbox = Array.from(document.querySelectorAll('input[type="checkbox"]')).find(cb => {
      const parent = cb.closest('li') || cb.closest('div');
      const text = parent?.textContent?.trim() || '';
      return text.length > 0 && text.length < 200 && !text.includes('検索');
    });

    if (!sampleCheckbox) {
      return;
    }

    // サンプルチェックボックスからスクロール可能な親要素を探す
    let scrollableElement = sampleCheckbox.parentElement;
    let attempts = 0;

    while (scrollableElement && scrollableElement !== document.body && attempts < 20) {
      const style = window.getComputedStyle(scrollableElement);
      const hasScroll = scrollableElement.scrollHeight > scrollableElement.clientHeight + 10;

      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && hasScroll) {
        break;
      }

      scrollableElement = scrollableElement.parentElement;
      attempts++;
    }

    if (!scrollableElement || scrollableElement === document.body) {
      // スクロールなしで直接操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      let totalChanged = 0;

      allCheckboxes.forEach((checkbox) => {
        const parent = checkbox.closest('li') || checkbox.closest('div') || checkbox.parentElement;
        const rawText = parent?.textContent?.trim() || '';

        if (rawText && rawText.length > 0 && rawText.length < 200 && !rawText.includes('検索')) {
          const calendarId = getCalendarId(checkbox);
          const shouldBeChecked = checkedCalendarIds.has(calendarId);

          if (checkbox.checked !== shouldBeChecked) {
            setCheckboxState(checkbox, shouldBeChecked);
            totalChanged++;
          }
        }
      });

      return;
    }

    // スクロール可能なコンテナが見つかった場合、段階的スクロール
    const originalScrollTop = scrollableElement.scrollTop;
    const scrollHeight = scrollableElement.scrollHeight;
    const clientHeight = scrollableElement.clientHeight;

    // 操作済みのチェックボックスを記録（重複操作防止）
    const processedCheckboxes = new Set();
    let totalChanged = 0;

    // 上から下へ段階的にスクロール
    const scrollStep = Math.max(clientHeight * 0.8, 200);
    scrollableElement.scrollTop = 0;

    for (let scrollPos = 0; scrollPos <= scrollHeight; scrollPos += scrollStep) {
      scrollableElement.scrollTop = scrollPos;
      await new Promise(resolve => setTimeout(resolve, 30));

      // 現在表示されているチェックボックスを操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

      allCheckboxes.forEach((checkbox) => {
        if (processedCheckboxes.has(checkbox)) return;

        const parent = checkbox.closest('li') || checkbox.closest('div') || checkbox.parentElement;
        const rawText = parent?.textContent?.trim() || '';

        if (rawText && rawText.length > 0 && rawText.length < 200 && !rawText.includes('検索')) {
          processedCheckboxes.add(checkbox);

          const calendarId = getCalendarId(checkbox);
          const shouldBeChecked = checkedCalendarIds.has(calendarId);

          if (checkbox.checked !== shouldBeChecked) {
            setCheckboxState(checkbox, shouldBeChecked);
            totalChanged++;
          }
        }
      });
    }

    // 元の位置に戻す
    scrollableElement.scrollTop = originalScrollTop;
  } finally {
    isExecuting = false;
  }
}

// 全て選択（段階的スクロール）
async function selectAll() {
  if (isExecuting) {
    return;
  }

  isExecuting = true;

  try {
    // グループを展開
    await expandAllCalendarGroups();

    // まず1つのカレンダーチェックボックスを見つける
    const sampleCheckbox = Array.from(document.querySelectorAll('input[type="checkbox"]')).find(cb => {
      const parent = cb.closest('li') || cb.closest('div');
      const text = parent?.textContent?.trim() || '';
      return text.length > 0 && text.length < 200 && !text.includes('検索');
    });

    if (!sampleCheckbox) {
      return;
    }

    // サンプルチェックボックスからスクロール可能な親要素を探す
    let scrollableElement = sampleCheckbox.parentElement;
    let attempts = 0;

    while (scrollableElement && scrollableElement !== document.body && attempts < 20) {
      const style = window.getComputedStyle(scrollableElement);
      const hasScroll = scrollableElement.scrollHeight > scrollableElement.clientHeight + 10;

      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && hasScroll) {
        break;
      }

      scrollableElement = scrollableElement.parentElement;
      attempts++;
    }

    if (!scrollableElement || scrollableElement === document.body) {
      // スクロールなしで直接操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

      allCheckboxes.forEach((checkbox) => {
        const parent = checkbox.closest('li') || checkbox.closest('div') || checkbox.parentElement;
        const rawText = parent?.textContent?.trim() || '';

        if (rawText && rawText.length > 0 && rawText.length < 200 && !rawText.includes('検索')) {
          if (!checkbox.checked) {
            setCheckboxState(checkbox, true);
          }
        }
      });

      return;
    }

    // スクロール可能なコンテナが見つかった場合、段階的スクロール
    const originalScrollTop = scrollableElement.scrollTop;
    const scrollHeight = scrollableElement.scrollHeight;
    const clientHeight = scrollableElement.clientHeight;

    // 操作済みのチェックボックスを記録（重複操作防止）
    const processedCheckboxes = new Set();

    // 上から下へ段階的にスクロール
    const scrollStep = Math.max(clientHeight * 0.8, 200);
    scrollableElement.scrollTop = 0;

    for (let scrollPos = 0; scrollPos <= scrollHeight; scrollPos += scrollStep) {
      scrollableElement.scrollTop = scrollPos;
      await new Promise(resolve => setTimeout(resolve, 30));

      // 現在表示されているチェックボックスを操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

      allCheckboxes.forEach((checkbox) => {
        if (processedCheckboxes.has(checkbox)) return;

        const parent = checkbox.closest('li') || checkbox.closest('div') || checkbox.parentElement;
        const rawText = parent?.textContent?.trim() || '';

        if (rawText && rawText.length > 0 && rawText.length < 200 && !rawText.includes('検索')) {
          processedCheckboxes.add(checkbox);

          if (!checkbox.checked) {
            setCheckboxState(checkbox, true);
          }
        }
      });
    }

    // 元の位置に戻す
    scrollableElement.scrollTop = originalScrollTop;
  } finally {
    isExecuting = false;
  }
}

// 全て解除（段階的スクロール）
async function deselectAll(includePrimary = true) {
  if (isExecuting) {
    return;
  }

  isExecuting = true;

  try {
    // グループを展開
    await expandAllCalendarGroups();

    // まず1つのカレンダーチェックボックスを見つける
    const sampleCheckbox = Array.from(document.querySelectorAll('input[type="checkbox"]')).find(cb => {
      const parent = cb.closest('li') || cb.closest('div');
      const text = parent?.textContent?.trim() || '';
      return text.length > 0 && text.length < 200 && !text.includes('検索');
    });

    if (!sampleCheckbox) {
      return;
    }

    // サンプルチェックボックスからスクロール可能な親要素を探す
    let scrollableElement = sampleCheckbox.parentElement;
    let attempts = 0;

    while (scrollableElement && scrollableElement !== document.body && attempts < 20) {
      const style = window.getComputedStyle(scrollableElement);
      const hasScroll = scrollableElement.scrollHeight > scrollableElement.clientHeight + 10;

      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && hasScroll) {
        break;
      }

      scrollableElement = scrollableElement.parentElement;
      attempts++;
    }

    if (!scrollableElement || scrollableElement === document.body) {
      // スクロールなしで直接操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      let primaryCalendar = null;
      let totalDeselected = 0;

      allCheckboxes.forEach((checkbox) => {
        const parent = checkbox.closest('li') || checkbox.closest('div') || checkbox.parentElement;
        const rawText = parent?.textContent?.trim() || '';

        if (rawText && rawText.length > 0 && rawText.length < 200 && !rawText.includes('検索')) {
          // 最初のカレンダーをプライマリとして記録
          if (!primaryCalendar) {
            primaryCalendar = checkbox;
          }

          // includePrimaryがtrueの場合は全て解除、falseの場合はプライマリ以外を解除
          const shouldDeselect = includePrimary ? checkbox.checked : (checkbox.checked && checkbox !== primaryCalendar);

          if (shouldDeselect) {
            setCheckboxState(checkbox, false);
            totalDeselected++;
          }
        }
      });

      return;
    }

    const originalScrollTop = scrollableElement.scrollTop;
    const scrollHeight = scrollableElement.scrollHeight;
    const clientHeight = scrollableElement.clientHeight;

    // 操作済みのチェックボックスを記録（重複操作防止）
    const processedCheckboxes = new Set();
    let primaryCalendar = null;
    let totalDeselected = 0;

    // 上から下へ段階的にスクロール
    const scrollStep = Math.max(clientHeight * 0.8, 200); // 画面の80%ずつ（より速く）
    scrollableElement.scrollTop = 0;

    for (let scrollPos = 0; scrollPos <= scrollHeight; scrollPos += scrollStep) {
      scrollableElement.scrollTop = scrollPos;
      await new Promise(resolve => setTimeout(resolve, 30)); // DOM更新を待つ（短縮）

      // 現在表示されているチェックボックスを操作
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

      allCheckboxes.forEach((checkbox) => {
        if (processedCheckboxes.has(checkbox)) return;

        const parent = checkbox.closest('li') || checkbox.closest('div') || checkbox.parentElement;
        const rawText = parent?.textContent?.trim() || '';

        if (rawText && rawText.length > 0 && rawText.length < 200 && !rawText.includes('検索')) {
          processedCheckboxes.add(checkbox);

          // 最初のカレンダーをプライマリとして記録
          if (!primaryCalendar) {
            primaryCalendar = checkbox;
          }

          // includePrimaryがtrueの場合は全て解除、falseの場合はプライマリ以外を解除
          const shouldDeselect = includePrimary ? checkbox.checked : (checkbox.checked && checkbox !== primaryCalendar);

          if (shouldDeselect) {
            setCheckboxState(checkbox, false);
            totalDeselected++;
          }
        }
      });
    }

    // 元の位置に戻す
    scrollableElement.scrollTop = originalScrollTop;
  } finally {
    isExecuting = false;
  }
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // メッセージ検証
  if (!request || typeof request !== 'object') {
    sendResponse({ error: 'Invalid message format' });
    return true;
  }

  if (!request.action || typeof request.action !== 'string') {
    sendResponse({ error: 'Invalid action' });
    return true;
  }

  // 許可されたアクションのみ
  const allowedActions = ['getCurrentState', 'applyPreset', 'selectAll', 'deselectAll'];
  if (!allowedActions.includes(request.action)) {
    sendResponse({ error: 'Unknown action' });
    return true;
  }

  // 非同期処理の場合
  const handleAsync = async () => {
    try {
      switch (request.action) {
        case 'getCurrentState':
          const state = await getCurrentState();
          return state;

        case 'applyPreset':
          // calendarsパラメータの検証
          if (!Array.isArray(request.calendars)) {
            return { error: 'Invalid calendars parameter' };
          }
          await applyPreset(request.calendars);
          return { success: true };

        case 'selectAll':
          await selectAll();
          return { success: true };

        case 'deselectAll':
          // includePrimaryパラメータの検証
          const includePrimary = typeof request.includePrimary === 'boolean'
            ? request.includePrimary
            : true;
          await deselectAll(includePrimary);
          return { success: true };

        default:
          return { error: 'Unknown action' };
      }
    } catch (error) {
      console.error('Error:', error);
      return { error: error.message };
    }
  };

  // 非同期処理を実行してレスポンスを送る
  handleAsync().then(response => {
    sendResponse(response);
  });

  return true; // 非同期レスポンスを許可
});
