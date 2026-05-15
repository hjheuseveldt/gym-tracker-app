import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./theme.css";

(function lockDocumentZoom() {
  const block = (e) => e.preventDefault();
  const nonPassive = { passive: false };

  document.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) block(e);
    },
    nonPassive
  );

  document.addEventListener("gesturestart", block, nonPassive);
  document.addEventListener("gesturechange", block, nonPassive);
  document.addEventListener("gestureend", block, nonPassive);
})();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
