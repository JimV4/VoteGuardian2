import { useContext } from 'react';
import { DeployedVoteGuardianContext, type DeployedVoteGuardianAPIProvider } from '../contexts';

/**
 * Retrieves the currently in-scope deployed boards provider.
 *
 * @returns The currently in-scope {@link DeployedBVoteGuardianAPIProvider} implementation.
 *
 * @internal
 */
export const useDeployedVoteGuardianContext = (): DeployedVoteGuardianAPIProvider => {
  const context = useContext(DeployedVoteGuardianContext);

  if (!context) {
    throw new Error('A <DeployedVoteGuardianProvider /> is required.');
  }

  return context;
};
