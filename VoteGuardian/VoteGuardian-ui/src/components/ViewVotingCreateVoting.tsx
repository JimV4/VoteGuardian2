import React, { useCallback, useEffect, useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Button, CardActions, CardContent, IconButton, Stack, Typography } from '@mui/material';
import VoteGuardianAddIcon from '@mui/icons-material/PostAddOutlined';
import { TextPromptDialog } from './TextPromptDialog';
import { Backdrop, CircularProgress } from '@mui/material';
import StopIcon from '@mui/icons-material/HighlightOffOutlined';
import { useNavigate } from 'react-router-dom';
import { Observable } from 'rxjs';
import { VoteGuardianDeployment } from '../contexts';
import { DeployedVoteGuardianAPI, VoteGuardianDerivedState } from '@midnight-ntwrk/vote-guardian-api';

const subtle = window.crypto.subtle;

export interface ViewVotingsCreateVotingProps {
  voteGuardianDeployment$?: Observable<VoteGuardianDeployment>;
}

export const ViewVotingsCreateVoting: React.FC<Readonly<ViewVotingsCreateVotingProps>> = ({
  voteGuardianDeployment$,
}) => {
  const [voteGuardianDeployment, setVoteGuardianDeployment] = useState<VoteGuardianDeployment>();
  const [deployedVoteGuardianAPI, setDeployedVoteGuardianAPI] = useState<DeployedVoteGuardianAPI>();
  const [voteGuardianState, setVoteGuardianState] = useState<VoteGuardianDerivedState>();

  const [isWorking, setIsWorking] = useState(!!voteGuardianDeployment$);
  const [errorMessage, setErrorMessage] = useState<string>();
  const navigate = useNavigate();

  const onCreateVoting = useCallback(async () => {
    setIsWorking(true);
    try {
      if (deployedVoteGuardianAPI) {
        setIsWorking(true);
        await deployedVoteGuardianAPI.create_voting();
        navigate('/votings');
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedVoteGuardianAPI, setErrorMessage, setIsWorking]);

  // Subscribes to the `state$` observable on a `DeployedVoteGuardianAPI` if we receive one, allowing the
  // component to receive updates to the change in contract state; otherwise we update the UI to
  // reflect the error was received instead.
  useEffect(() => {
    if (!voteGuardianDeployment) {
      return;
    }
    if (voteGuardianDeployment.status === 'in-progress') {
      return;
    }

    setIsWorking(false);

    if (voteGuardianDeployment.status === 'failed') {
      setErrorMessage(
        voteGuardianDeployment.error.message.length
          ? voteGuardianDeployment.error.message
          : 'Encountered an unexpected error.',
      );
      console.log(voteGuardianDeployment.error.message);
      // setErrorMessage(voteGuardianDeployment.error.message);
      return;
    }

    // We need the voteGuardian API as well as subscribing to its `state$` observable, so that we can invoke

    setDeployedVoteGuardianAPI(voteGuardianDeployment.api);
    const subscription = voteGuardianDeployment.api.state$.subscribe(setVoteGuardianState);
    return () => {
      subscription.unsubscribe();
    };
  }, [voteGuardianDeployment, setIsWorking, setErrorMessage, setDeployedVoteGuardianAPI]);

  return (
    <>
      <CardContent>
        <Typography align="center" variant="h4" gutterBottom color="primary.dark">
          <VoteGuardianAddIcon fontSize="large" />
        </Typography>
        <Typography align="center" variant="body1" color="textSecondary">
          Create or View.
        </Typography>
      </CardContent>

      <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={() => navigate('/votings')}
          data-testid="vote-guardian-join-btn"
        >
          View Votings
        </Button>

        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={onCreateVoting}
          data-testid="vote-guardian-join-btn"
        >
          Create Voting
        </Button>
        <Backdrop
          sx={{
            position: 'absolute',
            color: '#fff',
            width: '100%', // Full width of the Card
            height: '100%',
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
          open={isWorking}
        >
          <CircularProgress data-testid="vote-guardian-working-indicator" />
        </Backdrop>
        <Backdrop
          sx={{ position: 'absolute', color: '#ff0000', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={!!errorMessage}
        >
          <StopIcon fontSize="large" />
          <Typography component="div" data-testid="vote-guardian-error-message">
            {errorMessage}
          </Typography>
        </Backdrop>
      </Stack>
    </>
  );
};
