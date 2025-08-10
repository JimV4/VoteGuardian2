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
import { ViewVotingsCreateVoting } from './components/ViewVotingCreateVoting';

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
  const [voteGuardianDeployment$, setVoteGuardianDeployment$] = useState<Observable<VoteGuardianDeployment>>();

  const navigate = useNavigate();

  useEffect(() => {
    const subscription = VoteGuardianApiProvider.voteGuardianDeployments$.subscribe(setVoteGuardianDeployments);

    return () => {
      subscription.unsubscribe();
    };
  }, [VoteGuardianApiProvider]);

  const onJoinVoteGuardian = useCallback(
    (contractAddress: ContractAddress, secretKey: string) => {
      console.log(`address: ${contractAddress}`);
      const deployment$ = VoteGuardianApiProvider.resolve(contractAddress, secretKey);
      setVoteGuardianDeployment$(deployment$);
      navigate('/viewCreate');
    },
    [VoteGuardianApiProvider, navigate],
  );

  return (
    <Box sx={{ background: '#000', minHeight: '100vh' }}>
      <MainLayout>
        <Routes>
          <Route path="/" element={<JoinContract onJoinVoteGuardianCallback={onJoinVoteGuardian} />} />
          <Route
            path="/votings"
            element={
              <div data-testid="VoteGuardian-0">
                <VoteGuardian voteGuardianDeployment$={voteGuardianDeployment$} />
              </div>
            }
          />
          <Route
            path="/viewCreate"
            element={<ViewVotingsCreateVoting voteGuardianDeployment$={voteGuardianDeployment$} />}
          />
          <Route path="/votings/:votingId" element={<Voting voteGuardianDeployment$={voteGuardianDeployment$} />} />
        </Routes>
      </MainLayout>
    </Box>
  );
};

export default App;
