import React, { useCallback, useEffect, useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import {
  Backdrop,
  CircularProgress,
  Card,
  CardHeader,
  IconButton,
  Skeleton,
  Typography,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material';

import CopyIcon from '@mui/icons-material/ContentPasteOutlined';
import StopIcon from '@mui/icons-material/HighlightOffOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { VoteGuardianDerivedState, type DeployedVoteGuardianAPI, utils } from '@midnight-ntwrk/vote-guardian-api';
import { useDeployedVoteGuardianContext } from '../hooks';
import { type VoteGuardianDeployment } from '../contexts';
import { type Observable } from 'rxjs';
import { VOTE_STATE } from '@midnight-ntwrk/vote-guardian-contract';
import { useNavigate } from 'react-router-dom';
import { useLocation, useParams } from 'react-router-dom';
// import { console } from 'inspector';

const subtle = window.crypto.subtle;

const serverUrl = process.env.REACT_APP_API_URL;

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Hex string must have even length');
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

export interface VotingProps {
  voteGuardianDeployment$?: Observable<VoteGuardianDeployment>;
}

export const Voting: React.FC<Readonly<VotingProps>> = ({ voteGuardianDeployment$ }) => {
  const navigate = useNavigate();
  const voteGuardianApiProvider = useDeployedVoteGuardianContext();
  const [voteGuardianDeployment, setVoteGuardianDeployment] = useState<VoteGuardianDeployment>();
  const [deployedVoteGuardianAPI, setDeployedVoteGuardianAPI] = useState<DeployedVoteGuardianAPI>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [voteGuardianState, setVoteGuardianState] = useState<VoteGuardianDerivedState>();
  const [messagePrompt, setMessagePrompt] = useState<string>();
  const [isWorking, setIsWorking] = useState(!!voteGuardianDeployment$);
  const [optionCounter, setOptionCounter] = useState(0);
  const [secretKey, setSecretKey] = useState<string>();
  const [vote, setVote] = useState<string>();
  const [walletPublicKey, setWalletPublicKey] = useState<string>();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const { votingId } = useParams();

  const votingIdBytes = hexToUint8Array(votingId!);

  // const [onHome, setOnHome] = useState(true);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [whatIsEditing, setWhatIsEditing] = useState<'question' | 'option' | 'voters' | 'cast' | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [votingState, setVotingState] = useState<'open' | 'closed' | null>(null);

  const onShowResults = (): void => {
    setShowPrompt(false);
    setIsEditing(false);
    setWhatIsEditing(null);
    setShowResults(true);
  };

  // const onAdd = useCallback(
  //   async (whatIsEditing: 'question' | 'option' | 'voters' | 'cast', voteOption?: string) => {
  //     if (!messagePrompt) {
  //       return;
  //     }
  //     const size =
  //       typeof voteGuardianState?.votingOptions?.size === 'function'
  //         ? Number(voteGuardianState.votingOptions.size()) // call it
  //         : Number(voteGuardianState?.votingOptions?.size ?? 0); // or get the value

  //     const optionMapLength =
  //       size > 0 && voteGuardianState?.votingOptions?.member(votingIdBytes)
  //         ? Array.from(voteGuardianState.votingOptions.lookup(votingIdBytes) ?? []).length
  //         : 0;
  //     if (whatIsEditing === 'option') {
  //       setOptionCounter((prevCounter) => prevCounter + 1);
  //     }
  //     try {
  //       if (deployedVoteGuardianAPI) {
  //         setIsWorking(true);

  //         if (whatIsEditing === 'option') {
  //           let messagePromtUint8: Uint8Array = new TextEncoder().encode(messagePrompt);
  //           await deployedVoteGuardianAPI.add_option(votingIdBytes, messagePromtUint8, optionMapLength.toString());
  //         } else if (whatIsEditing === 'question') {
  //           await deployedVoteGuardianAPI.edit_question(votingIdBytes, messagePrompt);
  //         } else if (whatIsEditing === 'cast') {
  //           await deployedVoteGuardianAPI.cast_vote(votingIdBytes, voteOption!);
  //         }
  //       }
  //     } catch (error: unknown) {
  //       setErrorMessage(error instanceof Error ? error.message : String(error));
  //     } finally {
  //       setIsWorking(false);
  //     }
  //   },
  //   [deployedVoteGuardianAPI, setErrorMessage, setIsWorking, messagePrompt],
  // );

  // const handleEditClickInside = (): void => {
  //   setShowPrompt((prev) => !prev);
  // };

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  //   setCredentials({ ...credentials, [e.target.name]: e.target.value });
  // };

  // const handleEditClick = (type: 'question' | 'option' | 'voters' | 'cast'): void => {
  //   setIsEditing(true);
  //   setWhatIsEditing(type);
  // };

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
          setMessagePrompt(key);
        }
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  };

  const onDisplayVote = async (): Promise<void> => {
    try {
      console.log('display vote');
      if (vote !== undefined) {
        setVote(undefined);
      } else {
        if (deployedVoteGuardianAPI) {
          setIsWorking(true);
          console.log(votingIdBytes);
          console.log(votingId!);
          const vote = await voteGuardianApiProvider.getVoteForVoting(votingId!);
          console.log(vote);
          setVote(vote);
          setMessagePrompt(vote);
        }
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  };

  const onDisplayWalletPublicKey = async (): Promise<void> => {
    try {
      console.log('display');
      if (walletPublicKey !== undefined) {
        setWalletPublicKey(undefined);
      } else {
        if (deployedVoteGuardianAPI) {
          setIsWorking(true);
          const walletPubKey = await voteGuardianApiProvider.getWalletPublicKey();
          console.log(walletPubKey);
          setWalletPublicKey(walletPubKey);
          setMessagePrompt(walletPubKey);
        }
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  };

  const handleVoteState = useCallback(
    async (state: 'open' | 'closed') => {
      try {
        if (deployedVoteGuardianAPI) {
          setIsWorking(true);
          if (state === 'open') {
            await deployedVoteGuardianAPI.close_voting(votingIdBytes);
            setVotingState('closed');
          } else {
            await deployedVoteGuardianAPI.open_voting(votingIdBytes);
            setVotingState('open');
          }
        }
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setIsWorking(false);
      }
    },
    [deployedVoteGuardianAPI, setErrorMessage, setIsWorking],
  );

  const handlePublishVote = useCallback(
    async (votingId: Uint8Array) => {
      try {
        if (deployedVoteGuardianAPI) {
          setIsWorking(true);
          await deployedVoteGuardianAPI.publish_vote(votingId);
        }
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setIsWorking(false);
      }
    },
    [deployedVoteGuardianAPI, setErrorMessage, setIsWorking],
  );

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

  const onCopyContractAddress = useCallback(async () => {
    if (deployedVoteGuardianAPI) {
      await navigator.clipboard.writeText(deployedVoteGuardianAPI.deployedContractAddress);
    }
  }, [deployedVoteGuardianAPI]);

  return (
    <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
      {/* <Card
        sx={{ position: 'relative', width: 460, maxHeight: 495, minWidth: 460, minHeight: 495, overflowY: 'auto' }}
        color="primary"
      > */}
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
      {showResults &&
        (() => {
          if (!voteGuardianState) {
            return <Typography>No votes yet.</Typography>;
          }

          // Check if this votingIdBytes exists in both results and options
          const hasResults = voteGuardianState.votingResults?.member?.(votingIdBytes);
          const hasOptions = voteGuardianState.votingOptions?.member?.(votingIdBytes);

          if (!hasResults || !hasOptions) {
            return <Typography>No votes yet.</Typography>;
          }

          const resultsForVoting = voteGuardianState.votingResults.lookup(votingIdBytes);
          const optionsForVoting = voteGuardianState.votingOptions.lookup(votingIdBytes);

          if (!resultsForVoting || !optionsForVoting) {
            return <Typography>No votes yet.</Typography>;
          }

          const optionsArray = Array.from(optionsForVoting as Iterable<[Uint8Array]>);

          const entries = optionsArray.map(([optionKey]) => {
            const count = resultsForVoting.member(optionKey) ? resultsForVoting.lookup(optionKey).read() : BigInt(0);
            return [utils.fromBytes32(optionKey), count] as [string, bigint];
          });

          if (entries.length === 0) {
            return <Typography>No votes yet.</Typography>;
          }

          return (
            <Stack spacing={2} alignItems="center">
              {entries.map(([label, count]) => (
                <Typography key={label} data-testid="vote-guardian-option" minHeight={20} color="black">
                  {label}: {count.toString()}
                </Typography>
              ))}
            </Stack>
          );
        })()}

      {!isEditing && !showResults && (
        <>
          {voteGuardianDeployment$ && !isEditing && (
            <React.Fragment>
              <CardHeader
                avatar={<Skeleton variant="circular" width={20} height={20} />}
                title={
                  <Typography
                    color="primary"
                    sx={{
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap',
                      width: '100%',
                    }}
                  >
                    {deployedVoteGuardianAPI?.deployedContractAddress ?? 'Loading...'}
                  </Typography>
                }
                action={
                  deployedVoteGuardianAPI?.deployedContractAddress ? (
                    <IconButton title="Copy contract address" onClick={onCopyContractAddress}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <Skeleton variant="circular" width={20} height={20} />
                  )
                }
              />
              <Typography color="primary">
                Vote State is{' '}
                {voteGuardianState && voteGuardianState.votingStates.member(votingIdBytes)
                  ? voteGuardianState.votingStates.lookup(votingIdBytes) === VOTE_STATE.open
                    ? 'open'
                    : 'closed'
                  : 'No State'}
              </Typography>

              <Stack spacing={2} alignItems="center">
                {/* // VOTE STATE */}
                {voteGuardianState?.votingStates && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="medium"
                    onClick={() =>
                      handleVoteState(
                        voteGuardianState?.votingStates?.lookup?.(votingIdBytes) === VOTE_STATE.open
                          ? 'open'
                          : 'closed',
                      ).catch(console.error)
                    }
                  >
                    {voteGuardianState?.votingStates?.lookup?.(votingIdBytes) === VOTE_STATE.open
                      ? 'CLOSE VOTING'
                      : 'OPEN VOTING'}
                  </Button>
                )}

                {/* END VOTE STATE */}

                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={() => {
                    navigate(`/votings/${votingId}/question`);
                  }}
                >
                  Question
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={() => {
                    navigate(`/votings/${votingId}/option`);
                  }}
                >
                  Options
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={() => {
                    navigate(`/votings/${votingId}/cast`);
                  }}
                >
                  Vote
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

                {/* DISPLAY VOTE */}

                <Button variant="contained" color="primary" size="medium" onClick={onDisplayVote}>
                  {vote !== undefined ? 'Hide vote' : 'Display vote'}
                </Button>
                {vote !== undefined && (
                  <Typography
                    color="black"
                    sx={{
                      wordBreak: 'break-all', // breaks long words (like secret keys)
                      whiteSpace: 'pre-wrap', // preserves whitespace, allows wrapping
                      width: '100%', // ensures it uses the full container width
                      textAlign: 'center', // optional, for better visual balance
                    }}
                  >
                    {vote}
                  </Typography>
                )}
                {/* END DISPLAY VOTE */}

                {/* DISPLAY WALLET PUBLIC KEY */}

                <Button variant="contained" color="primary" size="medium" onClick={onDisplayWalletPublicKey}>
                  {walletPublicKey !== undefined ? 'Hide wallet public key' : 'Display wallet public key'}
                </Button>
                {walletPublicKey !== undefined && (
                  <Typography
                    color="black"
                    sx={{
                      wordBreak: 'break-all', // breaks long words (like secret keys)
                      whiteSpace: 'pre-wrap', // preserves whitespace, allows wrapping
                      width: '100%', // ensures it uses the full container width
                      textAlign: 'center', // optional, for better visual balance
                    }}
                  >
                    {walletPublicKey}
                  </Typography>
                )}
                {/* END DISPLAY WALLET PUBLIC KEY */}

                {/* SHOW RESULTS */}
                <Button variant="contained" color="primary" size="medium" onClick={onShowResults}>
                  SHOW RESULTS
                </Button>
                {/* END SHOW RESULTS */}
              </Stack>
            </React.Fragment>
          )}
        </>
      )}
      {/* </Card> */}
    </Stack>
  );
};
