import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "./index.css";
import "./i18n";
import App from "./App.jsx";
import api from "./api/axios";

// First Principles: Centralize network logic. 
// Safely migrate all 139 existing fetch() calls across 43 components directly into the Axios engine.
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : Object.prototype.toString.call(args[0]));
  
  // If this is an internal API call to Laravel, intercept and route through Axios
  if (typeof url === 'string' && (url.includes('localhost:8000/api/v1') || url.startsWith('/'))) {
    const options = args[1] || {};
    const method = (options.method || 'GET').toUpperCase();
    const cleanUrl = url.replace('http://localhost:8000/api/v1', '');
    
    let data;
    if (options.body) {
      if (options.body instanceof FormData) {
        data = options.body;
      } else if (typeof options.body === 'string') {
        try { data = JSON.parse(options.body); } catch(e) { data = options.body; }
      } else {
        data = options.body;
      }
    }

    try {
      const res = await api({
        url: cleanUrl,
        method,
        data,
      });
      // Emulate the standard Web Response object so existing components do not crash
      return {
        ok: true,
        status: res.status,
        json: async () => res.data,
        text: async () => JSON.stringify(res.data),
        blob: async () => res.data,
      };
    } catch (error) {
       return {
         ok: false,
         status: error.response?.status || 500,
         json: async () => error.response?.data || {},
         text: async () => JSON.stringify(error.response?.data || {}),
       };
    }
  }

  // Fallback to native fetch for external CDNs, fonts, etc.
  return originalFetch(...args);
};

const theme = extendTheme({
  fonts: {
    heading: `'Figtree', 'Khmer OS Battambang', 'Battambang', sans-serif`,
    body: `'Figtree', 'Khmer OS Battambang', 'Battambang', sans-serif`,
  },
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  colors: {
    // Custom darker grays for better dark mode depth
    gray: {
      750: "#1e2433",
      850: "#141925",
      925: "#0e1117",
    },
  },
  semanticTokens: {
    colors: {
      // App-wide background
      "app-bg": { default: "gray.100", _dark: "#0d1117" },
      // Card / surface background
      "card-bg": { default: "white", _dark: "#161b22" },
      // Sidebar background
      "sidebar-bg": { default: "white", _dark: "#0d1117" },
      // Topbar background
      "topbar-bg": { default: "whiteAlpha.900", _dark: "rgba(13,17,23,0.95)" },
      // Borders
      "border-color": { default: "gray.200", _dark: "#30363d" },
      // Text
      "text-primary": { default: "gray.800", _dark: "gray.100" },
      "text-muted": { default: "gray.500", _dark: "gray.400" },
      // Table header
      "table-header-bg": { default: "gray.50", _dark: "#161b22" },
      "table-hover-bg": { default: "gray.50", _dark: "#1c2333" },
      // Hover states
      "hover-bg": { default: "gray.100", _dark: "#1c2333" },
      // Input/Select background
      "input-bg": { default: "white", _dark: "#0d1117" },
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "dark" ? "#0d1117" : "gray.100",
        color: props.colorMode === "dark" ? "gray.100" : "gray.800",
      },
      // Scrollbar styling for dark mode
      "*::-webkit-scrollbar": {
        width: "6px",
        height: "6px",
      },
      "*::-webkit-scrollbar-track": {
        background: props.colorMode === "dark" ? "#0d1117" : "#f1f1f1",
      },
      "*::-webkit-scrollbar-thumb": {
        background: props.colorMode === "dark" ? "#30363d" : "#c1c1c1",
        borderRadius: "10px",
      },
      "*::-webkit-scrollbar-thumb:hover": {
        background: props.colorMode === "dark" ? "#484f58" : "#a1a1a1",
      },
    }),
  },
  components: {
    // Tables
    Table: {
      variants: {
        simple: (props) => ({
          th: {
            borderColor: props.colorMode === "dark" ? "#30363d" : "gray.200",
            color: props.colorMode === "dark" ? "gray.300" : "gray.600",
          },
          td: {
            borderColor: props.colorMode === "dark" ? "#21262d" : "gray.100",
          },
        }),
      },
    },
    // Modals
    Modal: {
      baseStyle: (props) => ({
        dialog: {
          bg: props.colorMode === "dark" ? "#161b22" : "white",
          borderColor: props.colorMode === "dark" ? "#30363d" : "gray.200",
          border: props.colorMode === "dark" ? "1px solid" : "none",
        },
        header: {
          color: props.colorMode === "dark" ? "gray.100" : "gray.800",
        },
      }),
    },
    // Menu (dropdowns)
    Menu: {
      baseStyle: (props) => ({
        list: {
          bg: props.colorMode === "dark" ? "#161b22" : "white",
          borderColor: props.colorMode === "dark" ? "#30363d" : "gray.200",
        },
        item: {
          bg: props.colorMode === "dark" ? "transparent" : "transparent",
          color: props.colorMode === "dark" ? "gray.200" : "gray.700",
          _hover: {
            bg: props.colorMode === "dark" ? "#1c2333" : "gray.50",
            color: props.colorMode === "dark" ? "white" : "blue.600",
          },
          _focus: {
            bg: props.colorMode === "dark" ? "#1c2333" : "gray.50",
          },
        },
      }),
    },
    // Inputs
    Input: {
      variants: {
        outline: (props) => ({
          field: {
            bg: props.colorMode === "dark" ? "#0d1117" : "white",
            borderColor: props.colorMode === "dark" ? "#30363d" : "gray.200",
            color: props.colorMode === "dark" ? "gray.100" : "gray.800",
            _hover: {
              borderColor: props.colorMode === "dark" ? "#484f58" : "gray.300",
            },
            _focus: {
              borderColor: "blue.500",
              boxShadow: props.colorMode === "dark" ? "0 0 0 1px #58a6ff" : "0 0 0 1px #3182ce",
            },
            _placeholder: {
              color: props.colorMode === "dark" ? "gray.500" : "gray.400",
            },
          },
        }),
      },
    },
    Textarea: {
      variants: {
        outline: (props) => ({
          bg: props.colorMode === "dark" ? "#0d1117" : "white",
          borderColor: props.colorMode === "dark" ? "#30363d" : "gray.200",
          color: props.colorMode === "dark" ? "gray.100" : "gray.800",
          _hover: {
            borderColor: props.colorMode === "dark" ? "#484f58" : "gray.300",
          },
          _focus: {
            borderColor: "blue.500",
            boxShadow: props.colorMode === "dark" ? "0 0 0 1px #58a6ff" : "0 0 0 1px #3182ce",
          },
          _placeholder: {
            color: props.colorMode === "dark" ? "gray.500" : "gray.400",
          },
        }),
      },
    },
    Select: {
      variants: {
        outline: (props) => ({
          field: {
            bg: props.colorMode === "dark" ? "#0d1117" : "white",
            borderColor: props.colorMode === "dark" ? "#30363d" : "gray.200",
            color: props.colorMode === "dark" ? "gray.100" : "gray.800",
            _hover: {
              borderColor: props.colorMode === "dark" ? "#484f58" : "gray.300",
            },
          },
        }),
      },
    },
    // Popover
    Popover: {
      baseStyle: (props) => ({
        content: {
          bg: props.colorMode === "dark" ? "#161b22" : "white",
          borderColor: props.colorMode === "dark" ? "#30363d" : "gray.200",
        },
      }),
    },
    // Badge
    Badge: {
      baseStyle: (props) => ({
        color: props.colorMode === "dark" ? "gray.100" : undefined,
      }),
    },
    // AlertDialog
    AlertDialog: {
      baseStyle: (props) => ({
        dialog: {
          bg: props.colorMode === "dark" ? "#161b22" : "white",
          border: props.colorMode === "dark" ? "1px solid" : "none",
          borderColor: props.colorMode === "dark" ? "#30363d" : "gray.200",
        },
      }),
    },
    // Tooltip
    Tooltip: {
      baseStyle: (props) => ({
        bg: props.colorMode === "dark" ? "#30363d" : "gray.700",
        color: props.colorMode === "dark" ? "gray.100" : "white",
      }),
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>,
);
