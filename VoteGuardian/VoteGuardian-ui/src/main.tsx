/**
 * A Single Page Application (SPA) for connecting to and managing deployed
 * bulletin boards.
 *
 * @packageDocumentation
 */
import './globals';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import { setNetworkId, NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import App from './App';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './config/theme';
import '@midnight-ntwrk/dapp-connector-api';
import * as pino from 'pino';
import { DeployedVoteGuardianProvider } from './contexts';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components';
import { DhSecretKeyProvider } from './contexts/DhSecretKeyContext';
import { JoinContract } from './components/JoinContract';

const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
// Ensure that the network IDs are set within the Midnight libraries.
// setNetworkId(NetworkId.TestNet);
setNetworkId(NetworkId.Undeployed);

// Create a default `pino` logger and configure it with the configured logging level.
export const logger = pino.pino({
  level: import.meta.env.VITE_LOGGING_LEVEL as string,
});

logger.trace('networkId = ', networkId);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <DeployedVoteGuardianProvider logger={logger}>
          <App />
        </DeployedVoteGuardianProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
