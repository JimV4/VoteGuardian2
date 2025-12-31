import React, { useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Button, CardActions, CardContent, IconButton, Stack, Typography } from '@mui/material';
import VoteGuardianAddIcon from '@mui/icons-material/PostAddOutlined';
import { TextPromptDialog } from './TextPromptDialog';
import { Backdrop, CircularProgress } from '@mui/material';
import StopIcon from '@mui/icons-material/HighlightOffOutlined';
import { useNavigate } from 'react-router-dom';
import LoginIcon from '@mui/icons-material/LoginOutlined';
const subtle = window.crypto.subtle;
/**
 * The props required by the {@link JoinContractProps} component.
 *
 * @internal
 */
export interface JoinContractProps {
  /** A callback that will be called to create a new bulletin voteGuardian. */
  /** A callback that will be called to join an existing bulletin voteGuardian. */
  onJoinVoteGuardianCallback: (contractAddress: ContractAddress, secretKey: string) => void;
}

/**
 * Used when there is no voteGuardian deployment to render a UI allowing the user to join or deploy bulletin voteGuardians.
 *
 * @internal
 */
export const JoinContract: React.FC<Readonly<JoinContractProps>> = ({ onJoinVoteGuardianCallback }) => {
  const [textPromptOpen, setTextPromptOpen] = useState(false);
  const [contractAddress, setContractAddress] = useState<ContractAddress | null>(null);
  const [secretPromptOpen, setSecretPromptOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <CardContent>
        <Typography align="center" variant="h4" gutterBottom color="primary.dark">
          <VoteGuardianAddIcon fontSize="large" />
        </Typography>
        <Typography align="center" variant="body1" color="textSecondary">
          Join an existing VoteGuardian contract.
        </Typography>
      </CardContent>

      <Stack spacing={1} alignItems="center" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={() => setTextPromptOpen(true)}
          data-testid="vote-guardian-join-btn"
        >
          Join Contract
        </Button>

        {/* New Authenticate Button */}
        <Button
          variant="outlined"
          size="large"
          color="primary"
          fullWidth
          startIcon={<LoginIcon />}
          onClick={() => navigate('/authenticate')} // 3. Navigation logic
          data-testid="authenticate-btn"
        >
          Authenticate
        </Button>
      </Stack>

      {/* Prompt for Contract Address */}
      <TextPromptDialog
        prompt="Enter contract address"
        isOpen={textPromptOpen}
        onCancel={() => setTextPromptOpen(false)}
        onSubmit={(text) => {
          setTextPromptOpen(false);
          setContractAddress(text);
          setSecretPromptOpen(true);
        }}
      />

      {/* Prompt for Secret Key */}
      <TextPromptDialog
        prompt="Enter secret key"
        isOpen={secretPromptOpen}
        onCancel={() => setSecretPromptOpen(false)}
        onSubmit={(secret) => {
          setSecretPromptOpen(false);
          if (contractAddress) {
            onJoinVoteGuardianCallback(contractAddress, secret);
          }
        }}
      />
      <Backdrop
        sx={{
          position: 'absolute',
          color: '#fff',
          width: '100%', // Full width of the Card
          height: '100%',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={loading}
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
    </>
  );
};
