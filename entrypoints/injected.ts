// This script runs in the MAIN world (page context) before other scripts
// It can intercept XHR/fetch and access page globals like jQuery

export default defineUnlistedScript(() => {
  console.log('[BMA Injected] Running in page context');

  // Intercept XHR
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
    const urlStr = url.toString();
    if (urlStr.includes('ajax') || urlStr.includes('band')) {
      console.log('[BMA Injected] XHR:', method, urlStr);
    }
    return originalXHROpen.apply(this, arguments as any);
  };

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('ajax') || url.includes('band')) {
      console.log('[BMA Injected] Fetch:', init?.method || 'GET', url);
    }
    return originalFetch.apply(this, arguments as any);
  };
});
