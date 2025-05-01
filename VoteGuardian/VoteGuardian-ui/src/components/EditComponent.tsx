import React, { useCallback, useState } from 'react';

import { type DeployedVoteGuardianAPI, utils } from '@midnight-ntwrk/vote-guardian-api';
import { type VoteGuardianDeployment } from '../contexts';
import { type Observable } from 'rxjs';
import { Typography } from '@mui/material';

export interface EditComponentProps {
  /** The observable bulletin voteGuardian deployment. */
  deployedVoteGuardianAPI: DeployedVoteGuardianAPI;
  whatIsEditing: 'question' | 'option' | 'voters';
  voteGuardianDeployment$?: Observable<VoteGuardianDeployment>;
}

export const EditComponent: React.FC<Readonly<EditComponentProps>> = ({
  deployedVoteGuardianAPI,
  whatIsEditing,
  voteGuardianDeployment$,
}) => {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [messagePrompt, setMessagePrompt] = useState<string>();
  const [optionCounter, setOptionCounter] = useState(0);
  const [isWorking, setIsWorking] = useState(!!voteGuardianDeployment$);

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
    <Typography color="black"> {whatIsEditing.charAt(0).toUpperCase() + whatIsEditing.slice(1) + ': '}</Typography>
  );
};
