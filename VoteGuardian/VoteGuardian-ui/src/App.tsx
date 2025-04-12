import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { MainLayout, VoteGuardian } from './components';
import { useDeployedVoteGuardianContext } from './hooks';
import { type VoteGuardianDeployment } from './contexts';
import { type Observable } from 'rxjs';

/**
 * The root bulletin VoteGuardian application component.
 *
 * @remarks
 * The {@link App} component requires a `<DeployedVoteGuardianProvider />` parent in order to retrieve
 * information about current bulletin VoteGuardian deployments.
 *
 * @internal
 */
const App: React.FC = () => {
  const VoteGuardianApiProvider = useDeployedVoteGuardianContext();
  const [VoteGuardianDeployments, setVoteGuardianDeployments] = useState<Array<Observable<VoteGuardianDeployment>>>([]);

  useEffect(() => {
    const subscription = VoteGuardianApiProvider.voteGuardianDeployments$.subscribe(setVoteGuardianDeployments);

    return () => {
      subscription.unsubscribe();
    };
  }, [VoteGuardianApiProvider]);

  return (
    <Box sx={{ background: '#000', minHeight: '100vh' }}>
      <MainLayout>
        {VoteGuardianDeployments.map((VoteGuardianDeployment, idx) => (
          <div data-testid={`VoteGuardian-${idx}`} key={`VoteGuardian-${idx}`}>
            <VoteGuardian voteGuardianDeployment$={VoteGuardianDeployment} />
          </div>
        ))}
        <div data-testid="VoteGuardian-start">
          <VoteGuardian />
        </div>
      </MainLayout>
    </Box>
  );
};

export default App;
