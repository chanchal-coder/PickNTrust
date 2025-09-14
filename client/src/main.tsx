import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add loading state to prevent black screen
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Show loading state initially
rootElement.innerHTML = `
  <div class="app-loading">
    <div style="text-align: center;">
      <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
      <p style="color: #666; font-family: Inter, sans-serif;">Loading PickNTrust...</p>
    </div>
  </div>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
`;

// Render the app
try {
  const root = createRoot(rootElement);
  root.render(<App />);
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Failed to render app:', error);
  rootElement.innerHTML = `
    <div class="app-loading">
      <div style="text-align: center; color: red;">
        <h2>Failed to load PickNTrust</h2>
        <p>Please refresh the page</p>
        <button onclick="window.location.reload()" style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Reload</button>
      </div>
    </div>
  `;
}
