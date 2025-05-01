import React, { useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Button, CardActions, CardContent, IconButton, Stack, Typography } from '@mui/material';
import VoteGuardianAddIcon from '@mui/icons-material/PostAddOutlined';
import CreateVoteGuardianIcon from '@mui/icons-material/AddCircleOutlined';
import JoinVoteGuardianIcon from '@mui/icons-material/AddLinkOutlined';
import { TextPromptDialog } from './TextPromptDialog';

/**
 * The props required by the {@link DeployOrJoinProps} component.
 *
 * @internal
 */
export interface DeployOrJoinProps {
  /** A callback that will be called to create a new bulletin voteGuardian. */
  onCreateVoteGuardianCallback: () => void;
  /** A callback that will be called to join an existing bulletin voteGuardian. */
  onJoinVoteGuardianCallback: (contractAddress: ContractAddress, secretKey: string) => void;
  isOrganizer: string;
}

/**
 * Used when there is no voteGuardian deployment to render a UI allowing the user to join or deploy bulletin voteGuardians.
 *
 * @internal
 */
export const DeployOrJoin: React.FC<Readonly<DeployOrJoinProps>> = ({
  onCreateVoteGuardianCallback,
  onJoinVoteGuardianCallback,
  isOrganizer,
}) => {
  const [textPromptOpen, setTextPromptOpen] = useState(false);
  const [contractAddress, setContractAddress] = useState<ContractAddress | null>(null);
  const [secretPromptOpen, setSecretPromptOpen] = useState(false);

  return (
    <>
      <CardContent>
        <Typography align="center" variant="h4" gutterBottom color="primary.dark">
          <VoteGuardianAddIcon fontSize="large" />
        </Typography>
        <Typography align="center" variant="body1" color="textSecondary">
          Create a new VoteGuardian or join an existing one.
        </Typography>
      </CardContent>

      <Stack spacing={3} alignItems="center" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={() => setTextPromptOpen(true)}
          data-testid="vote-guardian-join-btn"
        >
          Join Contract
        </Button>

        {isOrganizer === 'yes' && (
          <Button
            variant="outlined"
            size="large"
            color="secondary"
            onClick={onCreateVoteGuardianCallback}
            data-testid="vote-guardian-deploy-btn"
          >
            Deploy New Contract
          </Button>
        )}
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
    </>
  );
};
