
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "@/shared/styles/index.css";

createRoot(document.getElementById("root")).render(createElement(App));
