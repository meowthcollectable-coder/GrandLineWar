import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import Control from "./Control";
import "./styles.css";

const root = createRoot(document.getElementById("root"));
const path = window.location.pathname;
if (path.startsWith("/control")) {
  root.render(<Control />);
} else {
  root.render(<App />);
}
