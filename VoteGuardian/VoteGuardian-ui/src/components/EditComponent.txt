import React, { useCallback, useState } from 'react';

import { type DeployedVoteGuardianAPI, utils, VoteGuardianDerivedState } from '@midnight-ntwrk/vote-guardian-api';
import { type VoteGuardianDeployment } from '../contexts';
import { type Observable } from 'rxjs';
import { Button, TextField, Typography } from '@mui/material';

export interface EditComponentProps {
  /** The observable bulletin voteGuardian deployment. */
  deployedVoteGuardianAPI: DeployedVoteGuardianAPI | undefined;
  whatIsEditing: 'question' | 'option' | 'voters';
  voteGuardianDeployment$?: Observable<VoteGuardianDeployment>;
  voteGuardianState: VoteGuardianDerivedState | undefined;
}

export const EditComponent: React.FC<Readonly<EditComponentProps>> = ({
  deployedVoteGuardianAPI,
  whatIsEditing,
  voteGuardianDeployment$,
  voteGuardianState,
}) => {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [messagePrompt, setMessagePrompt] = useState<string>();
  const [showPrompt, setShowPrompt] = useState(false);
  const [optionCounter, setOptionCounter] = useState(0);
  const [isWorking, setIsWorking] = useState(!!voteGuardianDeployment$);

  const handleEditClick = (): void => {
    setShowPrompt((prev) => !prev);
  };

  const onAdd = useCallback(
    async (whatIsEditing: 'question' | 'option' | 'voters') => {
      if (!messagePrompt) {
        return;
      }

      if (whatIsEditing === 'option') {
        setOptionCounter((prevCounter) => prevCounter + 1);
      }
      try {
        if (deployedVoteGuardianAPI) {
          setIsWorking(true);

          if (whatIsEditing === 'option') {
            await deployedVoteGuardianAPI.add_option(messagePrompt, optionCounter.toString());
          } else if (whatIsEditing === 'question') {
            await deployedVoteGuardianAPI.create_voting(messagePrompt);
          } else if (whatIsEditing === 'voters') {
            await deployedVoteGuardianAPI.add_voter(utils.hexToBytes(messagePrompt));
          }
        }
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setIsWorking(false);
      }
    },
    [deployedVoteGuardianAPI, setErrorMessage, setIsWorking, messagePrompt],
  );

  return (
    <div className="w-full">
      <Typography>Question: {voteGuardianState?.voteQuestion || 'No question yet'}</Typography>
      <Button className="w-full bg-blue-600 text-white rounded-lg p-2" onClick={handleEditClick}>
        Edit
      </Button>

      {showPrompt && (
        <>
          <TextField
            id="message-prompt2"
            data-testid="vote-guardian-add-question-prompt"
            variant="outlined"
            focused
            // fullWidth
            // multiline
            minRows={6}
            maxRows={6}
            placeholder=""
            size="small"
            color="primary"
            inputProps={{ style: { color: 'black' } }}
            onChange={(e) => {
              setMessagePrompt(e.target.value);
            }}
          />
          <Button
            className="w-full bg-blue-600 text-white rounded-lg p-2"
            onClick={() => {
              onAdd(whatIsEditing);
            }}
          >
            Add
          </Button>
        </>
      )}
    </div>
  );
};
