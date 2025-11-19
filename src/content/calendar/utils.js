// チェックボックスの状態を設定（イベントも発火）
export function setCheckboxState(checkbox, checked) {
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
export function cleanCalendarName(rawName) {
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
export function getCalendarName(checkbox) {
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
export function getCalendarId(checkbox) {
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

// 現在の表示形式を取得
export function getCurrentViewType() {
  const url = window.location.href;

  // URLパターンをチェック
  if (url.includes('/r/day')) return 'day';
  if (url.includes('/r/week')) return 'week';
  if (url.includes('/r/month')) return 'month';
  if (url.includes('/r/year')) return 'year';
  if (url.includes('/r/agenda')) return 'agenda';
  if (url.includes('/r/customweek')) return 'customweek';
  if (url.includes('/r/customday')) return 'customday';

  return null;
}
