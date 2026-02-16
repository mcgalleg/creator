import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnalyticsApp } from "./app";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsApp />
  </StrictMode>
);
