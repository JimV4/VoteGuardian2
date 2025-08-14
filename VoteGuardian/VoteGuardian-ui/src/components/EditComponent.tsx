import React, { useCallback, useEffect, useState } from 'react';

import { type DeployedVoteGuardianAPI, utils, VoteGuardianDerivedState } from '@midnight-ntwrk/vote-guardian-api';
import { type VoteGuardianDeployment } from '../contexts';
import { type Observable } from 'rxjs';
import StopIcon from '@mui/icons-material/HighlightOffOutlined';

import {
  Backdrop,
  Button,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useParams } from 'react-router-dom';

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Hex string must have even length');
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

export interface EditComponentProps {
  voteGuardianDeployment$?: Observable<VoteGuardianDeployment>;
}

export const EditComponent: React.FC<Readonly<EditComponentProps>> = ({ voteGuardianDeployment$ }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [voteGuardianDeployment, setVoteGuardianDeployment] = useState<VoteGuardianDeployment>();
  const [deployedVoteGuardianAPI, setDeployedVoteGuardianAPI] = useState<DeployedVoteGuardianAPI>();
  const [isWorking, setIsWorking] = useState(!!voteGuardianDeployment$);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [messagePrompt, setMessagePrompt] = useState<string>();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [optionCounter, setOptionCounter] = useState(0);

  const [voteGuardianState, setVoteGuardianState] = useState<VoteGuardianDerivedState>();
  const { votingId, action } = useParams();

  const votingIdBytes = hexToUint8Array(votingId!);
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

  const handleEditClick = (): void => {
    setShowPrompt((prev) => !prev);
  };

  const onAdd = useCallback(
    async (action: string | undefined, voteOption?: string) => {
      if (!messagePrompt && action != 'cast') {
        return;
      }
      const size =
        typeof voteGuardianState?.votingOptions?.size === 'function'
          ? Number(voteGuardianState.votingOptions.size()) // call it
          : Number(voteGuardianState?.votingOptions?.size ?? 0); // or get the value

      const optionMapLength =
        size > 0 && voteGuardianState?.votingOptions?.member(votingIdBytes)
          ? Array.from(voteGuardianState.votingOptions.lookup(votingIdBytes) ?? []).length
          : 0;
      if (action === 'option') {
        setOptionCounter((prevCounter) => prevCounter + 1);
      }
      try {
        if (deployedVoteGuardianAPI) {
          setIsWorking(true);

          if (action === 'option') {
            await deployedVoteGuardianAPI.add_option(votingIdBytes, messagePrompt!, optionMapLength.toString());
          } else if (action === 'question') {
            await deployedVoteGuardianAPI.edit_question(votingIdBytes, messagePrompt!);
          } else if (action === 'cast') {
            await deployedVoteGuardianAPI.cast_vote(votingIdBytes, voteOption!);
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
    <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
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
      {(action === 'question' || action === 'cast') && (
        <Typography variant="body2" color="text.secondary">
          {voteGuardianState?.votingQuestions?.isEmpty?.()
            ? 'No question yet'
            : (voteGuardianState?.votingQuestions?.lookup?.(votingIdBytes) ?? 'No question yet')}
        </Typography>
      )}

      {action === 'option' &&
        (voteGuardianState?.votingOptions?.isEmpty?.() ? (
          <Typography data-testid="vote-guardian-option" color="black">
            No options yet.
          </Typography>
        ) : (
          (() => {
            const optionsIterable = voteGuardianState?.votingOptions?.lookup?.(votingIdBytes);
            const options = optionsIterable ? Array.from(optionsIterable as Iterable<[string, string]>) : [];

            return options.length > 0 ? (
              options.map(([key, value], index) => (
                <Typography key={key} data-testid="vote-guardian-option" minHeight={20} color="black">
                  {Number(value) + 1}. {key}
                </Typography>
              ))
            ) : (
              <Typography data-testid="vote-guardian-option" color="black">
                No options yet.
              </Typography>
            );
          })()
        ))}

      {action === 'cast' &&
        (() => {
          const optionsIterable = voteGuardianState?.votingOptions?.lookup?.(votingIdBytes);
          const options = optionsIterable ? Array.from(optionsIterable as Iterable<[string, string]>) : [];

          return options.length > 0 ? (
            <>
              <RadioGroup value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                {options.map(([key, value], index) => (
                  <FormControlLabel
                    key={key}
                    value={key}
                    control={<Radio />}
                    label={
                      <Typography data-testid="vote-guardian-option" minHeight={20} color="black">
                        {index + 1}. {key}
                      </Typography>
                    }
                  />
                ))}
              </RadioGroup>

              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => selectedOption && onAdd('cast', selectedOption)}
                disabled={!selectedOption}
              >
                Vote
              </Button>
            </>
          ) : (
            <Typography data-testid="vote-guardian-option" color="black">
              No options yet.
            </Typography>
          );
        })()}

      {showPrompt && action != 'cast' && (
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
              onAdd(action);
            }}
          >
            Add
          </Button>
        </>
      )}
      {(action === 'option' || action === 'question') && (
        <Button variant="contained" color="primary" size="medium" onClick={() => setShowPrompt((prev) => !prev)}>
          Edit
        </Button>
      )}
    </Stack>
  );
};
