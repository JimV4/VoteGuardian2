import React, { useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { CardActions, CardContent, IconButton, Typography } from '@mui/material';
import VoteGuardianAddIcon from '@mui/icons-material/PostAddOutlined';
import CreateVoteGuardianIcon from '@mui/icons-material/AddCircleOutlined';
import JoinVoteGuardianIcon from '@mui/icons-material/AddLinkOutlined';
import { TextPromptDialog } from './TextPromptDialog';

/**
 * The props required by the {@link EmptyCardContent} component.
 *
 * @internal
 */
export interface EmptyCardContentProps {
  /** A callback that will be called to create a new bulletin voteGuardian. */
  onCreateVoteGuardianCallback: () => void;
  /** A callback that will be called to join an existing bulletin voteGuardian. */
  onJoinVoteGuardianCallback: (contractAddress: ContractAddress /*, secretKey: string */) => void;
}

/**
 * Used when there is no voteGuardian deployment to render a UI allowing the user to join or deploy bulletin voteGuardians.
 *
 * @internal
 */
export const EmptyCardContent: React.FC<Readonly<EmptyCardContentProps>> = ({
  onCreateVoteGuardianCallback,
  onJoinVoteGuardianCallback,
}) => {
  const [textPromptOpen, setTextPromptOpen] = useState(false);
  const [contractAddress, setContractAddress] = useState<ContractAddress | null>(null);
  const [secretPromptOpen, setSecretPromptOpen] = useState(false);

  return (
    <React.Fragment>
      <CardContent>
        <Typography align="center" variant="h1" color="primary.dark">
          <VoteGuardianAddIcon fontSize="large" />
        </Typography>
        <Typography data-testid="vote-guardian-posted-message" align="center" variant="body2" color="primary.dark">
          Create a new VoteGuardian, or join an existing one...
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton
          title="Create a new vote guardian"
          data-testid="vote-guardian-deploy-btn"
          onClick={onCreateVoteGuardianCallback}
        >
          <CreateVoteGuardianIcon />
        </IconButton>
        <IconButton
          title="Join an existing vote guardian"
          data-testid="vote-guardian-join-btn"
          onClick={() => {
            setTextPromptOpen(true);
          }}
        >
          <JoinVoteGuardianIcon />
        </IconButton>
      </CardActions>
      {/* Prompt for Contract Address */}
      <TextPromptDialog
        prompt="Enter contract address"
        isOpen={textPromptOpen}
        onCancel={() => {
          setTextPromptOpen(false);
        }}
        onSubmit={(text) => {
          setTextPromptOpen(false);
          setContractAddress(text);
          setSecretPromptOpen(true); // Open the second prompt
        }}
      />

      {/* Prompt for Secret Key */}
      {/* <TextPromptDialog
        prompt="Enter secret key"
        isOpen={secretPromptOpen}
        onCancel={() => {
          setSecretPromptOpen(false);
        }}
        onSubmit={(secret) => {
          setSecretPromptOpen(false);
          if (contractAddress) {
            onJoinVoteGuardianCallback(contractAddress, secret);
          }
        }}
      /> */}
    </React.Fragment>
  );
};
