import React, { useCallback, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { MainLayout, VoteGuardian, Voting } from './components';
import { useDeployedVoteGuardianContext } from './hooks';
import { type VoteGuardianDeployment } from './contexts';
import { type Observable } from 'rxjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { JoinContract } from './components/JoinContract';
import { ContractAddress } from '@midnight-ntwrk/compact-runtime';

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

  const navigate = useNavigate();

  useEffect(() => {
    const subscription = VoteGuardianApiProvider.voteGuardianDeployments$.subscribe(setVoteGuardianDeployments);

    return () => {
      subscription.unsubscribe();
    };
  }, [VoteGuardianApiProvider]);

  const onJoinVoteGuardian = useCallback(
    (contractAddress: ContractAddress, secretKey: string) => {
      VoteGuardianApiProvider.resolve(contractAddress, secretKey);
      navigate('/home/viewCreate');
    },
    [VoteGuardianApiProvider, navigate],
  );

  return (
    <Box sx={{ background: '#000', minHeight: '100vh' }}>
      <MainLayout>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<JoinContract onJoinVoteGuardianCallback={onJoinVoteGuardian} />} />
            <Route
              path="/votings"
              element={
                VoteGuardianDeployments.length > 0 && (
                  <div data-testid="VoteGuardian-0">
                    <VoteGuardian voteGuardianDeployment$={VoteGuardianDeployments[0]} />
                  </div>
                )
              }
            />
            <Route path="/viewCreate" element={ViewVotingsCreateVoting} />
            <Route
              path="/votings/:votingId"
              element={<Voting voteGuardianDeployment$={VoteGuardianDeployments[0]} />}
            />
            {/* {VoteGuardianDeployments.length === 0 && (
          <div data-testid="VoteGuardian-start">
            {isOrganizer === 'yes' && <VoteGuardian isOrganizer={isOrganizer} />}
            {isOrganizer === 'no' && <VoteGuardianVoter isOrganizer={isOrganizer} />}
          </div>
        )} */}
          </Routes>
        </BrowserRouter>
      </MainLayout>
    </Box>
  );
};

export default App;
