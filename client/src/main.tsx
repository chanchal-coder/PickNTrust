import { createRoot } from "react-dom/client";
import "./index.css";

// Global error overlay for critical load failures
function showErrorOverlay(message: string) {
  const overlay = document.createElement("div");
  overlay.id = "global-error-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "#0b1220";
  overlay.style.color = "#fff";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";
  overlay.innerHTML = `<div style="text-align:center;background:#1f2937;border:1px solid #374151;padding:16px 20px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.35)"><h2 style="margin-bottom:8px;font-weight:700;color:#fca5a5">Service unavailable</h2><div style="font-size:14px;color:#e5e7eb">${message}</div></div>`;
  document.body.appendChild(overlay);
}

// Catch global runtime errors so users never see a blank page
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error || event.message);
  showErrorOverlay("A critical error occurred while loading the page.");
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  showErrorOverlay("A critical error occurred while initializing the app.");
});
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

// Diagnostic: allow forcing a minimal safe render to isolate mount issues
const params = new URLSearchParams(window.location.search);
const forceSafeApp = params.get("forceSafeApp") === "1" || localStorage.getItem("forceSafeApp") === "true";

if (forceSafeApp) {
  // Render a minimal page without importing App to bypass any module-level errors
  const SafeApp = () => (
    <div style={{
      minHeight: "100vh",
      background: "#0b1220",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "12px",
      fontFamily: "Inter, system-ui, Arial, sans-serif"
    }}>
      <div style={{
        background: "#1f2937",
        border: "1px solid #374151",
        padding: "16px 20px",
        borderRadius: "8px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
        maxWidth: "720px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: 6 }}>Safe Diagnostic Page</div>
        <div style={{ fontSize: "14px", opacity: 0.9 }}>
          React mounted successfully. This page bypasses the full App.
        </div>
      </div>
      <a href="/?" style={{
        color: "#93c5fd",
        textDecoration: "underline",
        fontSize: "14px"
      }}>Return to full app</a>
    </div>
  );
  root.render(<SafeApp />);
  mounted = true;
  const initialLoader = document.getElementById("initial-loader");
  if (initialLoader) initialLoader.remove();
  const globalOverlay = document.getElementById("global-error-overlay");
  if (globalOverlay) globalOverlay.remove();
  const debugTopbar = document.getElementById("debug-topbar");
  if (debugTopbar) debugTopbar.remove();
} else {
  // Default path: render App (static import moved to dynamic to enable force-safe bypass)
  import("./App")
    .then(({ default: App }) => {
      root.render(<App />);
      mounted = true;
      const initialLoader = document.getElementById("initial-loader");
      if (initialLoader) initialLoader.remove();
      const globalOverlay = document.getElementById("global-error-overlay");
      if (globalOverlay) globalOverlay.remove();
      const debugTopbar = document.getElementById("debug-topbar");
      if (debugTopbar) debugTopbar.remove();
    })
    .catch((err) => {
      console.error("Failed to load App:", err);
      showErrorOverlay("Failed to load application module.");
    });
}
