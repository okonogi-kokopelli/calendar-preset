// ES Modulesを動的にインポート
(async () => {
  try {
    const moduleUrl = chrome.runtime.getURL('src/content/message-handler.js');
    const { initMessageHandler } = await import(moduleUrl);
    initMessageHandler();
  } catch (error) {
    console.error('Failed to load content script modules:', error);
  }
})();
