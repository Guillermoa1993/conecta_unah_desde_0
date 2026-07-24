import { createRoot } from "react-dom/client";
import "virtual:pwa-register";
import App from "./app/App.tsx";
import "./styles/index.css";

// El manifest apunta al backend — devuelve 404 cuando MODO_PWA=0, JSON válido cuando =1
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
const link = document.createElement("link");
link.rel = "manifest";
link.href = `${API_URL}/parametros/manifest.webmanifest`;
document.head.appendChild(link);

createRoot(document.getElementById("root")!).render(<App />);
