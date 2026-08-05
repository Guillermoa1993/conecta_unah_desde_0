import { createRoot } from "react-dom/client";
import "virtual:pwa-register";
import App from "./app/App.tsx";
import "./styles/index.css";

// El manifest apunta estáticamente a /site.webmanifest o dinámicamente al backend según MODO_PWA
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
let link = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
if (!link) {
  link = document.createElement("link");
  link.rel = "manifest";
  document.head.appendChild(link);
}
link.href = "/manifest.json";

createRoot(document.getElementById("root")!).render(<App />);
