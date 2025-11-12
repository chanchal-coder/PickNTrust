import { createRoot } from "react-dom/client";
import { getSafeImageSrc } from "@/utils/imageProxy";
import "./index.css";

// Environment flag
const isDev = import.meta.env.DEV;

// Enforce a dark baseline immediately to prevent any white flash
try {
  document.documentElement.style.background = "#0b1220";
  document.body.style.background = "#0b1220";
} catch {}

// In development, default to widget safe mode to avoid any overlay
// hijacking the viewport and causing a white screen.
try {
  if (import.meta.env.DEV) {
    // Do not force baseline by default; enable only via URL param when needed
    // Keep optional safe-mode flags disabled unless explicitly toggled
  } else {
    // In production, ensure any debug flags from prior dev sessions are cleared
    localStorage.removeItem("forceAppBaseline");
    localStorage.removeItem("widgetsSafeMode");
    localStorage.removeItem("widgetsSafeModeFull");
    localStorage.removeItem("forceSafeApp");
  }
} catch {}

// Force Tailwind dark mode globally so dark: variants apply
try {
  document.documentElement.classList.add("dark");
} catch {}

// Inject optional runtime custom stylesheet if present (for admin uploads)
try {
  const ts = Date.now();
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `/custom.css?v=${ts}`;
  link.media = "all";
  link.onload = () => console.log("Custom CSS loaded");
  link.onerror = () => console.warn("Custom CSS not found or failed to load");
  document.head.appendChild(link);
} catch {}

// Global error overlay for critical load failures
function showErrorOverlay(message: string) {
  // In development, avoid blocking the UI with overlays; log instead
  if (isDev) {
    console.error("[Dev] Error overlay suppressed:", message);
    return;
  }
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
// Catch global runtime errors conservatively: only block pre-mount critical failures
window.addEventListener("error", (event) => {
  const msg = (event.error && (event.error.message || String(event.error))) || String(event.message || "");
  const isBenignError = /ResizeObserver loop limit exceeded|Script error\.|ERR_ABORTED|Image proxy error|HTTP 404/i.test(msg);
  console.error("Global error:", event.error || event.message);
  // Ignore known benign errors and avoid blocking the UI after mount
  if (isBenignError) {
    console.warn("Ignored benign error:", msg);
    return;
  }
  // Only show overlay if the app has not mounted yet (critical boot-time failure)
  if (!mounted && !isDev) {
    showErrorOverlay("A critical error occurred while loading the page.");
  }
});

// Remove aggressive rejection overlay; handle with conservative boot-time logic below
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
  if (!mounted && isChunkLoadFailure && !isDev) {
    console.error("Critical boot-time rejection:", e.reason);
    showErrorOverlay(msg);
  } else {
    // Log other rejections without blocking the UI
    console.error("Unhandled rejection:", e.reason);
  }
});

// Mount watchdog: if app doesn't mount quickly, render safe fallback automatically
let mounted = false;
const WATCHDOG_DELAY = isDev ? 6000 : 2500;
setTimeout(() => {
  if (!mounted) {
    try {
      console.warn("Boot watchdog: App not mounted in time. Rendering Safe fallback.");
      // Record that auto safe was triggered for diagnostics
      try { localStorage.setItem("autoSafeTriggered", "true"); } catch {}
      renderSafeFallback();
    } catch (e) {
      console.error("Failed to render Safe fallback:", e);
      showErrorOverlay("The app failed to start. Please retry.");
    }
  }
}, WATCHDOG_DELAY);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

// Immediately render a boot splash so users don't see a white screen
// while modules load or if an overlay interferes.
const BootSplash = () => (
  <div style={{
    minHeight: "100vh",
    background: "#0b1220",
    color: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "10px",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
  }}>
    <div style={{ fontSize: 16, opacity: 0.9 }}>Booting PickNTrust…</div>
    <div style={{
      display: "inline-block",
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      border: "3px solid #374151",
      borderTopColor: "#93c5fd",
      animation: "spin 1s linear infinite",
    }} />
    <style>{"@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }"}</style>
  </div>
);
try { root.render(<BootSplash />); } catch {}

// Signal to index.html fallback that boot has begun so it can clear overlays
try {
  (window as any).__PNT_BOOT_OK__ = true;
  window.dispatchEvent(new Event('pnt:boot-ok'));
} catch {}

// Diagnostic: allow forcing a minimal safe render to isolate mount issues
function renderSafeFallback() {
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
  const bootFallback = document.getElementById("boot-fallback-overlay");
  if (bootFallback) bootFallback.remove();
  const debugTopbar = document.getElementById("debug-topbar");
  if (debugTopbar) debugTopbar.remove();
}

// Global: rewrite Unsplash image sources to backend proxy to avoid ORB
function rewriteImgSrc(img: HTMLImageElement) {
  try {
    const src = img.getAttribute('src') || '';
    if (src && /images\.unsplash\.com/i.test(src)) {
      const proxied = getSafeImageSrc(src, { width: 800, height: 600, quality: 80, format: 'webp' });
      if (proxied && proxied !== src) {
        img.setAttribute('src', proxied);
        img.setAttribute('crossorigin', 'anonymous');
      }
    }
  } catch {}
}

// Apply to existing images
document.querySelectorAll('img').forEach((el) => rewriteImgSrc(el as HTMLImageElement));

// Observe future additions and attribute changes
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === 'childList') {
      m.addedNodes.forEach((node: any) => {
        if (!node) return;
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (el.tagName === 'IMG') rewriteImgSrc(el as HTMLImageElement);
          el.querySelectorAll?.('img').forEach((img) => rewriteImgSrc(img as HTMLImageElement));
        }
      });
    } else if (m.type === 'attributes' && (m.target as Element).tagName === 'IMG' && m.attributeName === 'src') {
      rewriteImgSrc(m.target as HTMLImageElement);
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
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
  try { root.render(<SafeApp />); } catch {}
  mounted = true;
  const initialLoader = document.getElementById("initial-loader");
  if (initialLoader) initialLoader.remove();
  const globalOverlay = document.getElementById("global-error-overlay");
  if (globalOverlay) globalOverlay.remove();
  const bootFallback = document.getElementById("boot-fallback-overlay");
  if (bootFallback) bootFallback.remove();
  const debugTopbar = document.getElementById("debug-topbar");
  if (debugTopbar) debugTopbar.remove();
} else {
  import("./App").then(({ default: App }) => {
    try {
      root.render(<App />);
      mounted = true;
      const initialLoader = document.getElementById("initial-loader");
      if (initialLoader) initialLoader.remove();
      const globalOverlay = document.getElementById("global-error-overlay");
      if (globalOverlay) globalOverlay.remove();
      const bootFallback = document.getElementById("boot-fallback-overlay");
      if (bootFallback) bootFallback.remove();
      const debugTopbar = document.getElementById("debug-topbar");
      if (debugTopbar) debugTopbar.remove();
    } catch (e) {
      console.error("Failed to render App:", e);
      showErrorOverlay("A critical error occurred while loading the app.");
    }
  }).catch((err) => {
    console.error("Failed to import App:", err);
    showErrorOverlay("A critical error occurred while loading the app.");
  });
}
