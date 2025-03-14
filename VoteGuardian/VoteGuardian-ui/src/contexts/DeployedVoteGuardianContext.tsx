import React, { type PropsWithChildren, createContext } from 'react';
import {
  type DeployedVoteGuardianAPIProvider,
  BrowserDeployedVoteGuardianManager,
} from './BrowserDeployedVoteGuardianManager';
import { type Logger } from 'pino';

/**
 * Encapsulates a deployed boards provider as a context object.
 */
export const DeployedVoteGuardianContext = createContext<DeployedVoteGuardianAPIProvider | undefined>(undefined);

/**
 * The props required by the {@link DeployedVoteGuardianProvider} component.
 */
export type DeployedVoteGuardianProviderProps = PropsWithChildren<{
  /** The `pino` logger to use. */
  logger: Logger;
}>;

/**
 * A React component that sets a new {@link BrowserDeployedVoteGuardianManager} object as the currently
 * in-scope deployed board provider.
 */
export const DeployedVoteGuardianProvider: React.FC<Readonly<DeployedVoteGuardianProviderProps>> = ({
  logger,
  children,
}) => (
  <DeployedVoteGuardianContext.Provider value={new BrowserDeployedVoteGuardianManager(logger)}>
    {children}
  </DeployedVoteGuardianContext.Provider>
);
