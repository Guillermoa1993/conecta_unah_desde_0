import { createRoot } from "react-dom/client";
import "virtual:pwa-register";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);
