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
import { useDeployedVoteGuardianContext } from '../hooks';

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
  const voteGuardianApiProvider = useDeployedVoteGuardianContext();
  const [deployedVoteGuardianAPI, setDeployedVoteGuardianAPI] = useState<DeployedVoteGuardianAPI>();
  const [isWorking, setIsWorking] = useState(!!voteGuardianDeployment$);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [messagePrompt, setMessagePrompt] = useState<string>();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [optionCounter, setOptionCounter] = useState(0);

  const [voteGuardianState, setVoteGuardianState] = useState<VoteGuardianDerivedState>();
  const { votingId, action } = useParams();

  const votingIdBytes = hexToUint8Array(votingId!);
  console.log(votingIdBytes);
  console.log(votingId);
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
      let current_vote: string = await voteGuardianApiProvider.getVoteForVoting(votingId!);

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
            let messagePromtUint8: Uint8Array = utils.toBytes32(messagePrompt!);
            await deployedVoteGuardianAPI.add_option(votingIdBytes, messagePromtUint8!);
          } else if (action === 'question') {
            await deployedVoteGuardianAPI.edit_question(votingIdBytes, messagePrompt!);
          } else if (action === 'cast') {
            const voteOptionUint8 = utils.toBytes32(voteOption!);
            console.log(`option bytes: ${voteOptionUint8}`);
            console.log(`option str: ${voteOption}`);
            await voteGuardianApiProvider.setPrivateStateVote(votingId!, voteOption!);
            // await voteGuardianApiProvider.setPrivateStateVote(votingId!, 'option2');
            await deployedVoteGuardianAPI.cast_vote(votingIdBytes);
          }
        }
      } catch (error: unknown) {
        await voteGuardianApiProvider.setPrivateStateVote(votingId!, current_vote);
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
    [deployedVoteGuardianAPI, setErrorMessage, setIsWorking, messagePrompt],
  );

  return (
    <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
      <Backdrop
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
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
        // <Typography variant="body2" color="text.secondary">
        //   {voteGuardianState?.votingQuestions?.isEmpty?.()
        //     ? 'No question yet'
        //     : (voteGuardianState?.votingQuestions?.lookup?.(votingIdBytes) ?? 'No question yet')}
        // </Typography>
        // <Typography variant="body2" color="text.secondary">
        //   {voteGuardianState?.votingQuestions?.isEmpty?.()
        //     ? 'No question yet'
        //     : votingIdBytes
        //       ? (voteGuardianState?.votingQuestions?.lookup?.(votingIdBytes) ?? 'No question yet')
        //       : 'Invalid votingIdBytes'}{' '}
        //   (id: {String(votingIdBytes)})
        // </Typography>
        <Typography variant="body2" color="text.secondary">
          {voteGuardianState == null
            ? 'No voteGuardianState'
            : (() => {
                let questionText = 'No question yet';
                if (!voteGuardianState.votingQuestions?.isEmpty?.() && votingIdBytes) {
                  try {
                    const result = voteGuardianState.votingQuestions.lookup(votingIdBytes);
                    questionText = result ?? 'No question yet';
                  } catch {
                    questionText = 'No question yet';
                  }
                }
                return questionText;
              })()}
        </Typography>
      )}

      {/* {action === 'option' &&
        (voteGuardianState?.votingOptions?.isEmpty?.() ? (
          <Typography data-testid="vote-guardian-option" color="black">
            No options yet.
          </Typography>
        ) : (
          (() => {
            const optionsIterable = voteGuardianState?.votingOptions?.lookup?.(votingIdBytes);
            const options = optionsIterable ? Array.from(optionsIterable as Iterable<Uint8Array>) : [];

            return options.length > 0 ? (
              options.map((key, index) => {
                // Convert Uint8Array → readable string
                const keyStr = utils.fromBytes32(key);

                return (
                  <Typography key={keyStr} data-testid="vote-guardian-option" minHeight={20} color="black">
                    {index + 1}. {keyStr}
                  </Typography>
                );
              })
            ) : (
              <Typography data-testid="vote-guardian-option" color="black">
                No options yet.
              </Typography>
            );
          })()
        ))} */}
      {action === 'option' &&
        (() => {
          try {
            // 1. Check if votingOptions map exists at all
            if (!voteGuardianState?.votingOptions) {
              throw new Error('Map not initialized');
            }

            // 2. Attempt the lookup
            const optionsIterable = voteGuardianState.votingOptions.lookup?.(votingIdBytes);

            // 3. Convert to array (safely checking if iterable exists)
            const options = optionsIterable ? Array.from(optionsIterable as Iterable<Uint8Array>) : [];

            // 4. If we have options, map them to Typography
            if (options.length > 0) {
              return options.map((key, index) => {
                const keyStr = utils.fromBytes32(key);
                return (
                  <Typography key={keyStr} data-testid="vote-guardian-option" minHeight={20} color="black">
                    {index + 1}. {keyStr}
                  </Typography>
                );
              });
            }

            // 5. If array is empty, fall through to the default return below
          } catch (error) {
            // This catches "Map undefined" or indexing errors
            console.warn('Midnight State Syncing:', error);
          }

          // Default "No options" view for empty arrays OR caught errors
          return (
            <Typography data-testid="vote-guardian-option" color="black">
              No options yet.
            </Typography>
          );
        })()}

      {/* {action === 'cast' &&
        (() => {
          const optionsIterable = voteGuardianState?.votingOptions?.lookup?.(votingIdBytes);
          const options = optionsIterable ? Array.from(optionsIterable as Iterable<Uint8Array>) : [];

          return options.length > 0 ? (
            <>
              <RadioGroup value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                {options.map((keyBytes, index) => {
                  // Decode each Uint8Array to a readable UTF-8 string
                  const keyStr = utils.fromBytes32(keyBytes);

                  return (
                    <FormControlLabel
                      key={keyStr}
                      value={keyStr}
                      control={<Radio />}
                      label={
                        <Typography data-testid="vote-guardian-option" minHeight={20} color="black">
                          {index + 1}. {keyStr}
                        </Typography>
                      }
                    />
                  );
                })}
              </RadioGroup>

              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => selectedOption && onAdd('cast', selectedOption).catch(console.error)}
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
        })()} */}
      {action === 'cast' &&
        (() => {
          try {
            // 1. Safety check for the map
            if (!voteGuardianState?.votingOptions) {
              throw new Error('Map not ready');
            }

            const optionsIterable = voteGuardianState.votingOptions.lookup?.(votingIdBytes);
            const options = optionsIterable ? Array.from(optionsIterable as Iterable<Uint8Array>) : [];

            if (options.length > 0) {
              return (
                <>
                  <RadioGroup value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                    {options.map((keyBytes, index) => {
                      const keyStr = utils.fromBytes32(keyBytes);
                      return (
                        <FormControlLabel
                          key={keyStr}
                          value={keyStr}
                          control={<Radio />}
                          label={
                            <Typography data-testid="vote-guardian-option" minHeight={20} color="black">
                              {index + 1}. {keyStr}
                            </Typography>
                          }
                        />
                      );
                    })}
                  </RadioGroup>

                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => selectedOption && onAdd('cast', selectedOption).catch(console.error)}
                    disabled={!selectedOption}
                    sx={{ mt: 2 }}
                  >
                    Vote
                  </Button>
                </>
              );
            }
          } catch (error) {
            console.warn('Cast view lookup failed, likely still syncing:', error);
          }

          // Fallback if lookup fails or options are empty
          return (
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
              onAdd(action).catch(console.error);
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
