(() => {
  if (!("serviceWorker" in navigator)) return;
  const SW_URL = "/sw.js?v=20260502";

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SW_URL)
      .then((reg) => {
        reg.update().catch(() => {});

        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {});
  });
})();
