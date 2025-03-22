import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { MainLayout, VoteGuardian, IdentityVerification } from './components';
import { useDeployedVoteGuardianContext } from './hooks';
import { type VoteGuardianDeployment } from './contexts';
import { type Observable } from 'rxjs';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

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
      <Router>
        <MainLayout>
          <Routes>
            {/* Home Route */}
            <Route
              path="/"
              element={
                <>
                  {VoteGuardianDeployments.map((VoteGuardianDeployment, idx) => (
                    <div data-testid={`VoteGuardian-${idx}`} key={`VoteGuardian-${idx}`}>
                      <VoteGuardian voteGuardianDeployment$={VoteGuardianDeployment} />
                    </div>
                  ))}
                  <div data-testid="VoteGuardian-start">
                    <VoteGuardian />
                  </div>
                </>
              }
            />

            {/* Another Route */}
            <Route path="/verify" element={<IdentityVerification />} />
          </Routes>
        </MainLayout>
      </Router>
    </Box>
  );
};

export default App;
