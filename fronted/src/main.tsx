import { StrictMode } from "react";
import { ConfigProvider } from "antd";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "antd/dist/reset.css";
import "./styles/global.css";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          fontSize: 12,
          fontSizeSM: 10,
          fontSizeLG: 14,
          fontSizeXL: 16,
          fontSizeHeading1: 20,
          fontSizeHeading2: 20,
          fontSizeHeading3: 16,
          fontSizeHeading4: 16,
          fontSizeHeading5: 14,
        },
        components: {
          Button: {
            contentFontSize: 12,
            contentFontSizeSM: 12,
            contentFontSizeLG: 14,
          },
          Modal: {
            titleFontSize: 16,
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
);
