import React, { useCallback, useEffect, useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import {
  Backdrop,
  CircularProgress,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Skeleton,
  Typography,
  TextField,
  Button,
  Box,
  Input,
  Stack,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import WriteIcon from '@mui/icons-material/EditNoteOutlined';
import CopyIcon from '@mui/icons-material/ContentPasteOutlined';
import StopIcon from '@mui/icons-material/HighlightOffOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { VoteGuardianDerivedState, type DeployedVoteGuardianAPI } from '@midnight-ntwrk/vote-guardian-api';
import { useDeployedVoteGuardianContext } from '../hooks';
import { type VoteGuardianDeployment } from '../contexts';
import { type Observable } from 'rxjs';
import { VOTE_STATE } from '@midnight-ntwrk/vote-guardian-contract';
import { EmptyCardContent } from './VoteGuardian.EmptyCardContent';
import { utils } from '@midnight-ntwrk/vote-guardian-api';
import { DeployOrJoin } from './DeployOrJoin';
import { EditComponent } from './EditComponent';

/** The props required by the {@link VoteGuardian} component. */
export interface VoteGuardianProps {
  /** The observable bulletin voteGuardian deployment. */
  voteGuardianDeployment$?: Observable<VoteGuardianDeployment>;
  isOrganizer: string;
}

/**
 * Provides the UI for a deployed bulletin voteGuardian contract; allowing messages to be posted or removed
 * following the rules enforced by the underlying Compact contract.
 *
 * @remarks
 * With no `voteGuardianDeployment$` observable, the component will render a UI that allows the user to create
 * or join bulletin voteGuardians. It requires a `<DeployedVoteGuardianProvider />` to be in scope in order to manage
 * these additional voteGuardians. It does this by invoking the `resolve(...)` method on the currently in-
 * scope `DeployedVoteGuardianContext`.
 *
 * When a `voteGuardianDeployment$` observable is received, the component begins by rendering a skeletal view of
 * itself, along with a loading background. It does this until the voteGuardian deployment receives a
 * `DeployedVoteGuardianAPI` instance, upon which it will then subscribe to its `state$` observable in order
 * to start receiving the changes in the bulletin voteGuardian state (i.e., when a user posts a new message).
 */
export const VoteGuardian: React.FC<Readonly<VoteGuardianProps>> = ({ voteGuardianDeployment$, isOrganizer }) => {
  const voteGuardianApiProvider = useDeployedVoteGuardianContext();
  const [voteGuardianDeployment, setVoteGuardianDeployment] = useState<VoteGuardianDeployment>();
  const [deployedVoteGuardianAPI, setDeployedVoteGuardianAPI] = useState<DeployedVoteGuardianAPI>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [voteGuardianState, setVoteGuardianState] = useState<VoteGuardianDerivedState>();
  const [messagePrompt, setMessagePrompt] = useState<string>();
  const [isWorking, setIsWorking] = useState(!!voteGuardianDeployment$);
  const [optionCounter, setOptionCounter] = useState(0);
  const [secretKey, setSecretKey] = useState<string>();
  const [walletPublicKey, setWalletPublicKey] = useState<string>();

  // const [onHome, setOnHome] = useState(true);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [whatIsEditing, setWhatIsEditing] = useState<'question' | 'option' | 'voters' | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleClickBackArrow = (): void => {
    setIsEditing((prev) => !prev);
    setShowResults(false);
  };

  const onShowResults = (): void => {
    setShowResults(true);
  };

  const onAdd = useCallback(
    async (whatIsEditing: 'question' | 'option' | 'voters') => {
      if (!messagePrompt) {
        return;
      }

      const optionMapLength = voteGuardianState?.voteOptionMap ? Array.from(voteGuardianState.voteOptionMap).length : 0;
      if (whatIsEditing === 'option') {
        setOptionCounter((prevCounter) => prevCounter + 1);
      }
      try {
        if (deployedVoteGuardianAPI) {
          setIsWorking(true);

          if (whatIsEditing === 'option') {
            await deployedVoteGuardianAPI.add_option(messagePrompt, optionMapLength.toString());
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

  const handleEditClickInside = (): void => {
    setShowPrompt((prev) => !prev);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleEditClick = (type: 'question' | 'option' | 'voters'): void => {
    setIsEditing(true);
    setWhatIsEditing(type);
  };

  // const handleSubmit = async (): Promise<void> => {
  //   setError(null);
  //   try {
  //     const walletPublicKey = await voteGuardianApiProvider.getWalletPublicKey();
  //     const input = {
  //       subject: {
  //         username: credentials.username,
  //         password: credentials.password,
  //         walletPubKey: walletPublicKey,
  //         contractAddress: deployedVoteGuardianAPI!.deployedContractAddress,
  //       },
  //     };
  //     console.log(input);
  //     const response = await fetch('http://localhost:3000/verify', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(input),
  //     });
  //     // const response = await axios.post('http://localhost:3000/login', { subject: credentials });
  //     const result = await response.json();
  //     const secret_key = result.secretKey;
  //     await voteGuardianApiProvider.setPrivateStateSecretKey(secret_key);
  //     console.log(secretKey);

  //     alert(`Login successful: ${JSON.stringify(result.secretKey)}`);
  //   } catch (err) {
  //     console.error(err);
  //     setError('Login failed. Please check your credentials.');
  //   }
  // };

  // Two simple callbacks that call `resolve(...)` to either deploy or join a bulletin voteGuardian
  // contract. Since the `DeployedVoteGuardianContext` will create a new voteGuardian and update the UI, we
  // don't have to do anything further once we've called `resolve`.
  const onCreateVoteGuardian = useCallback(() => voteGuardianApiProvider.resolve(), [voteGuardianApiProvider]);
  const onJoinVoteGuardian = useCallback(
    (contractAddress: ContractAddress, secretKey: string) =>
      voteGuardianApiProvider.resolve(contractAddress, secretKey),
    [voteGuardianApiProvider],
  );

  const onDisplayPaymentMap = useCallback(async () => {
    try {
      console.log('display');
      if (deployedVoteGuardianAPI) {
        await voteGuardianApiProvider.displayPublicPaymentMap(deployedVoteGuardianAPI.deployedContractAddress);
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedVoteGuardianAPI, setErrorMessage, setIsWorking]);

  const onDisplaySecretKey = async (): Promise<void> => {
    // useCallback(async () => {
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
  }; //, [deployedVoteGuardianAPI, setErrorMessage, setIsWorking, setSecretKey]);

  const onDisplayWalletPublicKey = async (): Promise<void> => {
    // useCallback(async () => {
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
  }; /*, [deployedVoteGuardianAPI, setErrorMessage, setIsWorking, setWalletPublicKey]); */

  // Callback to handle the posting of a message. The message text is captured in the `messagePrompt`
  // state, and we just need to forward it to the `post` method of the `DeployedVoteGuardianAPI` instance
  // that we received in the `deployedVoteGuardianAPI` state.
  const onCreateVoting = useCallback(async () => {
    if (!messagePrompt) {
      return;
    }

    try {
      if (deployedVoteGuardianAPI) {
        setIsWorking(true);
        await deployedVoteGuardianAPI.create_voting(messagePrompt);
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedVoteGuardianAPI, setErrorMessage, setIsWorking, messagePrompt]);

  // Callback to handle the taking down of a message. Again, we simply invoke the `takeDown` method
  // of the `DeployedVoteGuardianAPI` instance.
  const onAddVoter = useCallback(async () => {
    if (!messagePrompt) {
      return;
    }

    try {
      if (deployedVoteGuardianAPI) {
        setIsWorking(true);
        await deployedVoteGuardianAPI.add_voter(utils.hexToBytes(messagePrompt));
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedVoteGuardianAPI, setErrorMessage, setIsWorking, messagePrompt]);

  const onAddOption = useCallback(async () => {
    if (!messagePrompt) {
      return;
    }

    setOptionCounter((prevCounter) => prevCounter + 1);
    try {
      if (deployedVoteGuardianAPI) {
        setIsWorking(true);
        await deployedVoteGuardianAPI.add_option(messagePrompt, optionCounter.toString());
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedVoteGuardianAPI, setErrorMessage, setIsWorking, messagePrompt]);

  const onCastVote = useCallback(async () => {
    if (!messagePrompt) {
      return;
    }

    try {
      if (deployedVoteGuardianAPI) {
        setIsWorking(true);
        await deployedVoteGuardianAPI.cast_vote(messagePrompt);
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedVoteGuardianAPI, setErrorMessage, setIsWorking, messagePrompt]);

  const onCopyContractAddress = useCallback(async () => {
    if (deployedVoteGuardianAPI) {
      await navigator.clipboard.writeText(deployedVoteGuardianAPI.deployedContractAddress);
    }
  }, [deployedVoteGuardianAPI]);

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
    // the `post` and `takeDown` methods later.
    setDeployedVoteGuardianAPI(voteGuardianDeployment.api);
    const subscription = voteGuardianDeployment.api.state$.subscribe(setVoteGuardianState);
    return () => {
      subscription.unsubscribe();
    };
  }, [voteGuardianDeployment, setIsWorking, setErrorMessage, setDeployedVoteGuardianAPI]);

  return (
    <Card
      sx={{ position: 'relative', width: 460, height: 495, minWidth: 460, minHeight: 495, overflowY: 'auto' }}
      color="primary"
    >
      {showResults &&
        (() => {
          const voteCounts = new Map<string, number>();

          // Count each vote
          for (const [, vote] of voteGuardianState?.votesList ?? []) {
            voteCounts.set(vote, (voteCounts.get(vote) || 0) + 1);
          }

          const entries = Array.from(voteCounts.entries());

          return (
            <div
              className="w-full"
              style={{
                position: 'relative',
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh', // ensures vertical centering even on tall screens
              }}
            >
              <Stack spacing={2} alignItems="center">
                <IconButton
                  sx={{ position: 'absolute', top: 8, left: 8, mb: 2 }}
                  aria-label="back"
                  onClick={handleClickBackArrow}
                >
                  <ArrowBackIcon />
                </IconButton>

                {entries.length > 0 ? (
                  entries.map(([option, count]) => (
                    <Typography key={option} data-testid="vote-guardian-option" minHeight={20} color="black">
                      {option}: {count}
                    </Typography>
                  ))
                ) : (
                  <Typography data-testid="vote-guardian-option" color="black">
                    No votes yet.
                  </Typography>
                )}
              </Stack>
            </div>
          );
        })()}

      {isEditing && whatIsEditing != null && (
        // <EditComponent
        //   deployedVoteGuardianAPI={deployedVoteGuardianAPI}
        //   whatIsEditing={whatIsEditing}
        //   voteGuardianDeployment$={voteGuardianDeployment$}
        //   voteGuardianState={voteGuardianState}
        // />
        <div
          className="w-full"
          style={{
            position: 'relative',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh', // ensures vertical centering even on tall screens
          }}
        >
          <Stack spacing={2} alignItems="center">
            <IconButton
              sx={{ position: 'absolute', top: 8, left: 8, mb: 2 }}
              aria-label="back"
              onClick={handleClickBackArrow}
            >
              <ArrowBackIcon />
            </IconButton>
            {whatIsEditing === 'question' && (
              <Typography color="black">Question: {voteGuardianState?.voteQuestion || 'No question yet'}</Typography>
            )}
            {whatIsEditing === 'option' &&
              (voteGuardianState?.voteOptionMap ? (
                Array.from(voteGuardianState.voteOptionMap as Iterable<[string, string]>).map(([key, value]) => (
                  <Typography key={key} data-testid="vote-guardian-option" minHeight={20} color="black">
                    {key}. {value}
                  </Typography>
                ))
              ) : (
                <Typography data-testid="vote-guardian-option" color="black">
                  No options yet.
                </Typography>
              ))}
            <Button variant="contained" color="primary" size="medium" onClick={handleEditClickInside}>
              Edit
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
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={() => {
                    onAdd(whatIsEditing);
                  }}
                >
                  Add
                </Button>
              </>
            )}
          </Stack>
        </div>
      )}

      {/* {!isEditing && voteGuardianDeployment$ && !showResults && (
        <Card className="max-w-md mx-auto p-6 mt-10 shadow-lg rounded-2xl">
          <CardHeader title={'Identity Verification'} />
          <CardContent className="flex flex-col gap-4">
            <Input
              type="text"
              name="username"
              placeholder="Username"
              value={credentials.username}
              onChange={handleChange}
              className="p-2 border rounded-lg"
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              className="p-2 border rounded-lg"
            />
            {error && <p className="text-red-500">{error}</p>}
            <Button onClick={handleSubmit} className="w-full bg-blue-600 text-white rounded-lg p-2">
              Login
            </Button>
          </CardContent>
        </Card>
      )} */}

      {!isEditing && !showResults && (
        <>
          {/* {!voteGuardianDeployment$ && (
          <EmptyCardContent
            onCreateVoteGuardianCallback={onCreateVoteGuardian}
            onJoinVoteGuardianCallback={onJoinVoteGuardian}
          />
        )} */}
          {!voteGuardianDeployment$ && (
            <DeployOrJoin
              onCreateVoteGuardianCallback={onCreateVoteGuardian}
              onJoinVoteGuardianCallback={onJoinVoteGuardian}
              isOrganizer={isOrganizer}
            />
          )}

          {voteGuardianDeployment$ && !isEditing && isOrganizer === 'yes' && (
            <React.Fragment>
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
              {/* <CardHeader
                avatar={
                  // voteGuardianState ? (
                  //   voteGuardianState.state === STATE.vacant ||
                  //   (voteGuardianState.state === STATE.occupied && voteGuardianState.isOwner) ? (
                  //     <LockOpenIcon data-testid="post-unlocked-icon" />
                  //   ) : (
                  //     <LockIcon data-testid="post-locked-icon" />
                  //   )
                  // ) : (
                  <Skeleton variant="circular" width={20} height={20} />
                  // )
                }
                titleTypographyProps={{ color: 'primary' }}
                // title={toShortFormatContractAddress(deployedVoteGuardianAPI?.deployedContractAddress) ?? 'Loading...'}
                title={deployedVoteGuardianAPI?.deployedContractAddress ?? 'Loading...'}
                action={
                  deployedVoteGuardianAPI?.deployedContractAddress ? (
                    <IconButton title="Copy contract address" onClick={onCopyContractAddress}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <Skeleton variant="circular" width={20} height={20} />
                  )
                }
              /> */}
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
              {/* // VOTING QUESTION */}
              <Stack spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={() => {
                    handleEditClick('question');
                  }}
                >
                  Question
                </Button>

                {/* END VOTING QUESTION */}

                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={() => {
                    handleEditClick('option');
                  }}
                >
                  Options
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={() => {
                    handleEditClick('voters');
                  }}
                >
                  Voters
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

                <Button variant="contained" color="primary" size="medium" onClick={onDisplayPaymentMap}>
                  Display WALLET PUBLIC key
                </Button>

                {/* END DISPLAY WALLET PUBLIC KEY MAP */}

                {/* SHOW RESULTS */}
                <Button variant="contained" color="primary" size="medium" onClick={onShowResults}>
                  SHOW RESULTS
                </Button>
                {/* END SHOW RESULTS */}

                {/* VOTING OPTIONS */}
                {/* Array.from(voteGuardianState.voteOptionMap as Iterable<[string, string]>).map(([key, value]) => (
            <Typography key={key} data-testid="vote-guardian-option" minHeight={160} color="primary">
              {key}, {value}
            </Typography>
          )) */}
                {/* END VOTING OPTIONS */}

                {/* <CardActions>
            {deployedVoteGuardianAPI ? (
              <React.Fragment>
                <IconButton
                  title="Post message"
                  data-testid="vote-guardian-post-message-btn"
                  disabled={voteGuardianState?.state === STATE.occupied || !messagePrompt?.length}
                  onClick={onPostMessage}
                >
                  <WriteIcon />
                </IconButton>
                <IconButton
                  title="Take down message"
                  data-testid="vote-guardian-take-down-message-btn"
                  disabled={
                    voteGuardianState?.state === STATE.vacant ||
                    (voteGuardianState?.state === STATE.occupied && !voteGuardianState.isOwner)
                  }
                  onClick={onDeleteMessage}
                >
                  <DeleteIcon />
                </IconButton>
              </React.Fragment>
            ) : (
              <Skeleton variant="rectangular" width={80} height={20} />
            )}
          </CardActions> */}
              </Stack>
            </React.Fragment>
          )}
        </>
      )}
    </Card>
  );
  // return (
  //   <Card
  //     sx={{
  //       position: 'relative',
  //       width: '100%',
  //       maxWidth: 480,
  //       minHeight: 500,
  //       overflowY: 'auto',
  //       padding: 2,
  //       boxShadow: 3,
  //       borderRadius: 4,
  //       margin: 'auto',
  //       mt: 4,
  //     }}
  //     color="primary"
  //   >
  //     {showResults &&
  //       (() => {
  //         const voteCounts = new Map<string, number>();
  //         for (const [, vote] of voteGuardianState?.votesList ?? []) {
  //           voteCounts.set(vote, (voteCounts.get(vote) || 0) + 1);
  //         }
  //         const entries = Array.from(voteCounts.entries());

  //         return (
  //           <Box
  //             sx={{
  //               p: 3,
  //               display: 'flex',
  //               alignItems: 'center',
  //               justifyContent: 'center',
  //               minHeight: '60vh',
  //             }}
  //           >
  //             <Stack spacing={2} alignItems="center" sx={{ width: '100%', maxWidth: 400 }}>
  //               <IconButton
  //                 sx={{ position: 'absolute', top: 8, left: 8 }}
  //                 aria-label="back"
  //                 onClick={handleClickBackArrow}
  //               >
  //                 <ArrowBackIcon />
  //               </IconButton>

  //               {entries.length > 0 ? (
  //                 entries.map(([option, count]) => (
  //                   <Typography key={option} data-testid="vote-guardian-option" color="black">
  //                     {option}: {count}
  //                   </Typography>
  //                 ))
  //               ) : (
  //                 <Typography data-testid="vote-guardian-option" color="black">
  //                   No votes yet.
  //                 </Typography>
  //               )}
  //             </Stack>
  //           </Box>
  //         );
  //       })()}

  //     {isEditing && whatIsEditing != null && (
  //       <Box
  //         sx={{
  //           p: 3,
  //           display: 'flex',
  //           alignItems: 'center',
  //           justifyContent: 'center',
  //           minHeight: '60vh',
  //         }}
  //       >
  //         <Stack spacing={2} alignItems="center" sx={{ width: '100%', maxWidth: 400 }}>
  //           <IconButton sx={{ position: 'absolute', top: 8, left: 8 }} aria-label="back" onClick={handleClickBackArrow}>
  //             <ArrowBackIcon />
  //           </IconButton>

  //           {whatIsEditing === 'question' && (
  //             <Typography color="black">Question: {voteGuardianState?.voteQuestion || 'No question yet'}</Typography>
  //           )}

  //           {whatIsEditing === 'option' &&
  //             (voteGuardianState?.voteOptionMap ? (
  //               Array.from(voteGuardianState.voteOptionMap as Iterable<[string, string]>).map(([key, value]) => (
  //                 <Typography key={key} data-testid="vote-guardian-option" color="black">
  //                   {key}. {value}
  //                 </Typography>
  //               ))
  //             ) : (
  //               <Typography data-testid="vote-guardian-option" color="black">
  //                 No options yet.
  //               </Typography>
  //             ))}

  //           <Button variant="contained" color="primary" onClick={handleEditClickInside}>
  //             Edit
  //           </Button>

  //           <Backdrop
  //             sx={{
  //               position: 'absolute',
  //               color: '#fff',
  //               width: '100%',
  //               height: '100%',
  //               zIndex: (theme) => theme.zIndex.drawer + 1,
  //             }}
  //             open={isWorking}
  //           >
  //             <CircularProgress data-testid="vote-guardian-working-indicator" />
  //           </Backdrop>

  //           <Backdrop
  //             sx={{ position: 'absolute', color: '#ff0000', zIndex: (theme) => theme.zIndex.drawer + 1 }}
  //             open={!!errorMessage}
  //           >
  //             <StopIcon fontSize="large" />
  //             <Typography component="div" data-testid="vote-guardian-error-message">
  //               {errorMessage}
  //             </Typography>
  //           </Backdrop>

  //           {showPrompt && (
  //             <>
  //               <TextField
  //                 id="message-prompt2"
  //                 data-testid="vote-guardian-add-question-prompt"
  //                 variant="outlined"
  //                 minRows={6}
  //                 maxRows={6}
  //                 placeholder=""
  //                 size="small"
  //                 color="primary"
  //                 inputProps={{ style: { color: 'black' } }}
  //                 onChange={(e) => setMessagePrompt(e.target.value)}
  //                 fullWidth
  //               />
  //               <Button variant="contained" color="primary" size="small" onClick={() => onAdd(whatIsEditing)}>
  //                 Add
  //               </Button>
  //             </>
  //           )}
  //         </Stack>
  //       </Box>
  //     )}

  //     {!isEditing && voteGuardianDeployment$ && !showResults && (
  //       <Card className="mx-auto p-6 mt-6 shadow-lg rounded-2xl max-w-md">
  //         <CardHeader title="Identity Verification" />
  //         <CardContent className="flex flex-col gap-4">
  //           <Input
  //             type="text"
  //             name="username"
  //             placeholder="Username"
  //             value={credentials.username}
  //             onChange={handleChange}
  //             className="p-2 border rounded-lg"
  //           />
  //           <Input
  //             type="password"
  //             name="password"
  //             placeholder="Password"
  //             value={credentials.password}
  //             onChange={handleChange}
  //             className="p-2 border rounded-lg"
  //           />
  //           {error && <p className="text-red-500">{error}</p>}
  //           <Button onClick={handleSubmit} className="w-full bg-blue-600 text-white rounded-lg p-2">
  //             Login
  //           </Button>
  //         </CardContent>
  //       </Card>
  //     )}

  //     {!isEditing && !showResults && (
  //       <>
  //         {!voteGuardianDeployment$ && (
  //           <DeployOrJoin
  //             onCreateVoteGuardianCallback={onCreateVoteGuardian}
  //             onJoinVoteGuardianCallback={onJoinVoteGuardian}
  //             isOrganizer={isOrganizer}
  //           />
  //         )}

  //         {voteGuardianDeployment$ && isOrganizer === 'yes' && (
  //           <>
  //             <Backdrop
  //               sx={{
  //                 position: 'absolute',
  //                 color: '#fff',
  //                 width: '100%',
  //                 height: '100%',
  //                 zIndex: (theme) => theme.zIndex.drawer + 1,
  //               }}
  //               open={isWorking}
  //             >
  //               <CircularProgress data-testid="vote-guardian-working-indicator" />
  //             </Backdrop>

  //             <Backdrop
  //               sx={{ position: 'absolute', color: '#ff0000', zIndex: (theme) => theme.zIndex.drawer + 1 }}
  //               open={!!errorMessage}
  //             >
  //               <StopIcon fontSize="large" />
  //               <Typography component="div" data-testid="vote-guardian-error-message">
  //                 {errorMessage}
  //               </Typography>
  //             </Backdrop>

  //             <CardHeader
  //               avatar={<Skeleton variant="circular" width={20} height={20} />}
  //               titleTypographyProps={{ color: 'primary' }}
  //               title={deployedVoteGuardianAPI?.deployedContractAddress ?? 'Loading...'}
  //               action={
  //                 deployedVoteGuardianAPI?.deployedContractAddress ? (
  //                   <IconButton title="Copy contract address" onClick={onCopyContractAddress}>
  //                     <CopyIcon fontSize="small" />
  //                   </IconButton>
  //                 ) : (
  //                   <Skeleton variant="circular" width={20} height={20} />
  //                 )
  //               }
  //             />

  //             <Stack spacing={2} alignItems="center" sx={{ width: '100%', maxWidth: 400 }}>
  //               <Button variant="contained" color="primary" size="small" onClick={() => handleEditClick('question')}>
  //                 Question
  //               </Button>

  //               <Button variant="contained" color="primary" size="small" onClick={() => handleEditClick('option')}>
  //                 Options
  //               </Button>

  //               <Button variant="contained" color="primary" size="small" onClick={() => handleEditClick('voters')}>
  //                 Voters
  //               </Button>

  //               <Button variant="contained" color="primary" size="small" onClick={onDisplaySecretKey}>
  //                 {secretKey !== undefined ? 'Hide secret key' : 'Display secret key'}
  //               </Button>
  //               {secretKey !== undefined && <Typography color="black">{secretKey}</Typography>}

  //               <Button variant="contained" color="primary" size="small" onClick={onDisplayWalletPublicKey}>
  //                 {walletPublicKey !== undefined ? 'Hide wallet public key' : 'Display wallet public key'}
  //               </Button>
  //               {walletPublicKey !== undefined && <Typography color="black">{walletPublicKey}</Typography>}

  //               <Button variant="contained" color="primary" size="small" onClick={onDisplayPaymentMap}>
  //                 Display WALLET PUBLIC key
  //               </Button>

  //               <Button variant="contained" color="primary" size="small" onClick={onShowResults}>
  //                 SHOW RESULTS
  //               </Button>
  //             </Stack>
  //           </>
  //         )}
  //       </>
  //     )}
  //   </Card>
  // );
};

/** @internal */
const toShortFormatContractAddress = (contractAddress: ContractAddress | undefined): JSX.Element | undefined =>
  // Returns a new string made up of the first, and last, 8 characters of a given contract address.
  contractAddress ? (
    <span data-testid="vote-guardian-address">
      0x{contractAddress?.replace(/^[A-Fa-f0-9]{6}([A-Fa-f0-9]{8}).*([A-Fa-f0-9]{8})$/g, '$1...$2')}
    </span>
  ) : undefined;
