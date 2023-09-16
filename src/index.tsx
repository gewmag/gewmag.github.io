import React from "react";
import "./index.css";
import App from "./App";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ReactDOM from "react-dom/client";
import {
  EthereumClient,
  w3mProvider,
  w3mConnectors,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { infuraProvider } from "@wagmi/core/providers/infura";
import { publicProvider } from "wagmi/providers/public";
import HistoryPage from "./pages/HistoryPage"; // Import  του History page component

import { Buffer } from "buffer";
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}
window.Buffer = window.Buffer || Buffer;
const projectId = process.env.REACT_APP_PROJECT_ID || "";//Ορισμός του projectId από το .env
const conditional_chain = [mainnet, sepolia];// Ορισμός των αλυσίδων που θα χρησιμοποιηθούν
//Διαμόρφωση των αλυσίδων και του public client
const { chains, publicClient } = configureChains(conditional_chain, [
  w3mProvider({ projectId }),
  infuraProvider({
    apiKey: process.env.REACT_APP_API_KEY || "",
  }),
  publicProvider(),
]);
// Δημιουργία της διαμόρφωσης του Wagmi(development tool για EVM-based blockchains)
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient,
});
//Αρχικοποίηση του EthereumClient
const ethereumClient = new EthereumClient(wagmiConfig, chains);
//Εύρεση του rootElement με το id "root"
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <WagmiConfig config={wagmiConfig}>
        <Routes>
          <Route path="/" element={<App />} />{/*Δρομολόγηση στην αρχική σελίδα με το component App */}
          <Route path="/history" element={<HistoryPage />} />{/*Δρομολόγηση στη σελίδα ιστορικού με το component HistoryPage */}
        </Routes>
      </WagmiConfig>

      <Web3Modal
        themeVariables={{
          "--w3m-accent-color": "#bb1d2d",
          "--w3m-z-index": "150",
          "--w3m-background-color": "#bb1d2d",
        }}
        themeMode={"dark"}
        projectId={projectId}
        ethereumClient={ethereumClient}
      />
    </BrowserRouter>
  </React.StrictMode>
);
