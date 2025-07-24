import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { MainLayout, VoteGuardian } from './components';
import { useDeployedVoteGuardianContext } from './hooks';
import { type VoteGuardianDeployment } from './contexts';
import { type Observable } from 'rxjs';
import { useLocation } from 'react-router-dom';
import { VoteGuardianVoter } from './components/VoteGuardianVoter';
import { DhSecretKeyProvider } from './contexts/DhSecretKeyContext';
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

  const location = useLocation();
  const isOrganizer = location.state?.isOrganizer;
  console.log(isOrganizer);
  return (
    <Box sx={{ background: '#000', minHeight: '100vh' }}>
      <MainLayout>
        {/* {VoteGuardianDeployments.map((VoteGuardianDeployment, idx) => (
          <div data-testid={`VoteGuardian-${idx}`} key={`VoteGuardian-${idx}`}>
            {isOrganizer === 'yes' && (
              <VoteGuardian voteGuardianDeployment$={VoteGuardianDeployment} isOrganizer={isOrganizer} />
            )}
            {isOrganizer === 'no' && (
              <VoteGuardianVoter voteGuardianDeployment$={VoteGuardianDeployment} isOrganizer={isOrganizer} />
            )}
          </div>
        ))} */}
        {VoteGuardianDeployments.length > 0 && (
          <div data-testid="VoteGuardian-0">
            {isOrganizer === 'yes' && (
              <VoteGuardian voteGuardianDeployment$={VoteGuardianDeployments[0]} isOrganizer={isOrganizer} />
            )}
            {isOrganizer === 'no' && (
              <VoteGuardianVoter voteGuardianDeployment$={VoteGuardianDeployments[0]} isOrganizer={isOrganizer} />
            )}
          </div>
        )}
        {VoteGuardianDeployments.length === 0 && (
          <div data-testid="VoteGuardian-start">
            {isOrganizer === 'yes' && <VoteGuardian isOrganizer={isOrganizer} />}
            {isOrganizer === 'no' && <VoteGuardianVoter isOrganizer={isOrganizer} />}
          </div>
        )}
      </MainLayout>
    </Box>
  );
};

export default App;
