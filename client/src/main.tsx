import { createRoot } from "react-dom/client";
import "./index.css";

// Global error overlay for critical load failures
function showErrorOverlay(message: string) {
  const overlay = document.createElement("div");
  overlay.id = "global-error-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(255,255,255,0.95)";
  overlay.style.color = "#111";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";
  overlay.innerHTML = `<div style="text-align:center"><h2 style="margin-bottom:8px;font-weight:700;color:#dc2626">Service unavailable</h2><div style="font-size:14px;color:#444">${message}</div></div>`;
  document.body.appendChild(overlay);
}
// Be conservative: only show overlay for critical boot-time failures
window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
  const msg = (e.reason && (e.reason.message || String(e.reason))) || "Unhandled promise rejection.";
  const isChunkLoadFailure = /Loading chunk|Failed to fetch dynamically imported module|import\(\) failed/i.test(msg);
  const isBenignNetworkError = /getaddrinfo ENOTFOUND|Image proxy error|HTTP 404/i.test(msg);

  // Ignore known benign network errors that shouldn't block the app
  if (isBenignNetworkError) {
    console.warn("Ignored benign network error:", msg);
    return;
  }

  // Only show overlay for pre-mount chunk loading failures (critical boot issues)
  if (!mounted && isChunkLoadFailure) {
    console.error("Critical boot-time rejection:", e.reason);
    showErrorOverlay(msg);
  } else {
    // Log other rejections without blocking the UI
    console.error("Unhandled rejection:", e.reason);
  }
});

// Mount watchdog: if app doesn't mount in 3s, show overlay
let mounted = false;
setTimeout(() => {
  if (!mounted) {
    // Only show overlay if root is truly empty (no children rendered)
    const rootEl = document.getElementById("root");
    const hasChildren = !!rootEl && rootEl.childElementCount > 0;
    if (!hasChildren) {
      showErrorOverlay("The app failed to start. Please retry.");
    }
  }
}, 3000);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

// Dynamically import App to allow lazy chunk preloading behavior
import("./App")
  .then(({ default: App }) => {
    root.render(<App />);
    mounted = true;
    const initialLoader = document.getElementById("initial-loader");
    if (initialLoader) initialLoader.remove();
    const globalOverlay = document.getElementById("global-error-overlay");
    if (globalOverlay) globalOverlay.remove();
  })
  .catch((err) => {
    console.error("Failed to load App:", err);
    showErrorOverlay("Failed to load the application.");
  });
