import { getCurrentState } from './calendar/state.js';
import { applyPreset, selectAll, deselectAll } from './calendar/actions.js';

// メッセージリスナー
export function initMessageHandler() {
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
}
