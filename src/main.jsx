import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "./index.css";
import App from "./App.jsx";

const theme = extendTheme({
  fonts: {
    heading: `'Figtree', 'Battambang', sans-serif`,
    body: `'Figtree', 'Battambang', sans-serif`,
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>,
);
