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
import { useDeployedVoteGuardianContext } from '../hooks';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
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
  const [secretKey, setSecretKey] = useState<string>();
  // 1. Add these new states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  // 2. Modify the button click to open the dialog instead of calling the API directly
  const handleOpenDialog = () => setIsDialogOpen(true);

  const voteGuardianApiProvider = useDeployedVoteGuardianContext();
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const navigate = useNavigate();

  const onDisplaySecretKey = async (): Promise<void> => {
    try {
      console.log('display');
      if (secretKey !== undefined) {
        setSecretKey(undefined);
      } else {
        if (deployedVoteGuardianAPI) {
          setIsWorking(true);
          const key = await voteGuardianApiProvider.displaySecretKey();
          console.log(key);
          setSecretKey(key);
        }
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  };

  const onCreateVoting = useCallback(
    async (timestamp: number) => {
      setIsWorking(true);
      try {
        if (deployedVoteGuardianAPI) {
          console.log('before vreate');
          setIsWorking(true);
          await deployedVoteGuardianAPI.create_voting(BigInt(timestamp));
          console.log('after vreate');
          navigate('/votings');
        }
      } catch (error: unknown) {
        // setErrorMessage(error instanceof Error ? error.message : String(error));
        let message = error instanceof Error ? error.message : String(error);

        if (message.includes('type error:')) {
          message = 'Not authorized';
        }

        setErrorMessage(message);
      } finally {
        setIsWorking(false);
      }
    },
    [deployedVoteGuardianAPI, setErrorMessage, setIsWorking],
  );

  // 4. Helper to handle the "Confirm" button in the popup
  const handleConfirmCreate = () => {
    if (!expiryDate) {
      alert('Please select a date and time');
      return;
    }
    // Convert ISO string to Unix Timestamp (Seconds)
    const unixTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
    onCreateVoting(unixTimestamp);
  };
  // Subscribes to the `voteGuardianDeployment$` observable so that we can receive updates on the deployment.
  useEffect(() => {
    if (!voteGuardianDeployment$) {
      return;
    }

    const subscription = voteGuardianDeployment$.subscribe(setVoteGuardianDeployment);

    return () => {
      subscription.unsubscribe();
    };
  }, [voteGuardianDeployment$]);

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
          onClick={handleOpenDialog}
          data-testid="vote-guardian-join-btn"
        >
          Create Voting
        </Button>
        {/* DISPLAY SECRET KEY */}

        <Button variant="contained" color="primary" size="medium" onClick={onDisplaySecretKey}>
          {secretKey !== undefined ? 'Hide secret key' : 'Display secret key'}
        </Button>
        {secretKey !== undefined && (
          <Typography
            color="black"
            sx={{
              wordBreak: 'break-all', // breaks long words (like secret keys)
              whiteSpace: 'pre-wrap', // preserves whitespace, allows wrapping
              width: '100%', // ensures it uses the full container width
              textAlign: 'center', // optional, for better visual balance
            }}
          >
            {secretKey}
          </Typography>
        )}
        {/* END DISPLAY SECRET KEY */}

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
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Add public vote expiration date</DialogTitle>
        {/* <DialogContent sx={{ mt: 2, pt: 1 }}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Expiration Date & Time"
            InputLabelProps={{ shrink: true }}
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </DialogContent> */}
        <DialogContent>
          <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
            Add expiration date for vote publishing
          </Typography>
          <TextField
            fullWidth
            type="datetime-local"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmCreate} variant="contained" disabled={!expiryDate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
