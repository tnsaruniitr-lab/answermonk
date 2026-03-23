import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Auto-reload when a JS chunk fails to load after a new deployment.
// This happens when the browser has cached old HTML referencing old hashed
// chunk filenames that no longer exist. Reloading fetches fresh HTML with
// the correct new chunk URLs.
window.addEventListener("error", (e) => {
  const src = (e.target as HTMLScriptElement)?.src ?? "";
  if (src.includes("/assets/") && src.endsWith(".js")) {
    window.location.reload();
  }
});

// Catch unhandled promise rejections from dynamic imports
window.addEventListener("unhandledrejection", (e) => {
  const msg: string = e.reason?.message ?? "";
  if (msg.includes("Failed to fetch dynamically imported module") || msg.includes("Importing a module script failed")) {
    e.preventDefault();
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
