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
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import WriteIcon from '@mui/icons-material/EditNoteOutlined';
import CopyIcon from '@mui/icons-material/ContentPasteOutlined';
import StopIcon from '@mui/icons-material/HighlightOffOutlined';
import { type VoteGuardianDerivedState, type DeployedVoteGuardianAPI } from '@midnight-ntwrk/vote-guardian-api';
import { useDeployedVoteGuardianContext } from '../hooks';
import { type VoteGuardianDeployment } from '../contexts';
import { type Observable } from 'rxjs';
import { VOTE_STATE } from '@midnight-ntwrk/vote-guardian-contract';
import { EmptyCardContent } from './VoteGuardian.EmptyCardContent';
import { utils } from '@midnight-ntwrk/vote-guardian-api';

/** The props required by the {@link VoteGuardian} component. */
export interface VoteGuardianProps {
  /** The observable bulletin voteGuardian deployment. */
  voteGuardianDeployment$?: Observable<VoteGuardianDeployment>;
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
export const VoteGuardian: React.FC<Readonly<VoteGuardianProps>> = ({ voteGuardianDeployment$ }) => {
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

  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    try {
      const walletPublicKey = await voteGuardianApiProvider.getWalletPublicKey();
      const input = {
        subject: {
          username: credentials.username,
          password: credentials.password,
          walletPubKey: walletPublicKey,
          contractAddress: deployedVoteGuardianAPI!.deployedContractAddress,
        },
      };
      console.log(input);
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      // const response = await axios.post('http://localhost:3000/login', { subject: credentials });
      const result = await response.json();
      const secret_key = result.secretKey;
      await voteGuardianApiProvider.setPrivateStateSecretKey(secret_key);
      console.log(secretKey);

      alert(`Login successful: ${JSON.stringify(result.secretKey)}`);
    } catch (err) {
      console.error(err);
      setError('Login failed. Please check your credentials.');
    }
  };

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

  const onDisplaySecretKey = useCallback(async () => {
    try {
      console.log('display');
      if (deployedVoteGuardianAPI) {
        setIsWorking(true);
        const secretKey = await voteGuardianApiProvider.displaySecretKey();
        console.log(secretKey);
        setSecretKey(secretKey);
        setMessagePrompt(secretKey);
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedVoteGuardianAPI, setErrorMessage, setIsWorking]);

  const onDisplayWalletPublicKey = useCallback(async () => {
    try {
      console.log('display');
      if (deployedVoteGuardianAPI) {
        setIsWorking(true);
        const walletPublicKey = await voteGuardianApiProvider.getWalletPublicKey();
        console.log(walletPublicKey);
        setWalletPublicKey(walletPublicKey);
        setMessagePrompt(walletPublicKey);
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedVoteGuardianAPI, setErrorMessage, setIsWorking]);

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
    <div>
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

      <Card
        sx={{ position: 'relative', width: 300, height: 325, minWidth: 300, minHeight: 325, overflowY: 'auto' }}
        color="primary"
      >
        {!voteGuardianDeployment$ && (
          <EmptyCardContent
            onCreateVoteGuardianCallback={onCreateVoteGuardian}
            onJoinVoteGuardianCallback={onJoinVoteGuardian}
          />
        )}

        {voteGuardianDeployment$ && (
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
            <CardHeader
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
            />
            {/* // VOTING QUESTION */}
            <Typography data-testid="vote-guardian-question" minHeight={50} color="primary">
              {voteGuardianState?.voteQuestion || 'No question yet'}
            </Typography>
            {/* END VOTING QUESTION */}

            {/* DISPLAY SECRET KEY */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2, // Space between the TextField and Button
              }}
            >
              <CardContent
                sx={{
                  flex: 1, // Allow equal distribution
                  overflowY: 'auto', // Scroll if content overflows
                }}
              >
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
              </CardContent>
              <Button variant="contained" color="primary" size="small" onClick={onDisplaySecretKey}>
                Display secret key
              </Button>
            </Box>
            {/* END DISPLAY SECRET KEY */}

            {/* DISPLAY WALLET PUBLIC KEY */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2, // Space between the TextField and Button
              }}
            >
              <CardContent
                sx={{
                  flex: 1, // Allow equal distribution
                  overflowY: 'auto', // Scroll if content overflows
                }}
              >
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
              </CardContent>
              <Button variant="contained" color="primary" size="small" onClick={onDisplayWalletPublicKey}>
                Display WALLET PUBLIC key
              </Button>
            </Box>
            {/* END DISPLAY WALLET PUBLIC KEY */}

            {/* DISPLAY WALLET PUBLIC KEY MAP */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2, // Space between the TextField and Button
              }}
            >
              <CardContent
                sx={{
                  flex: 1, // Allow equal distribution
                  overflowY: 'auto', // Scroll if content overflows
                }}
              >
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
              </CardContent>
              <Button variant="contained" color="primary" size="small" onClick={onDisplayPaymentMap}>
                Display WALLET PUBLIC key
              </Button>
            </Box>
            {/* END DISPLAY WALLET PUBLIC KEY MAP*/}

            {/* VOTING OPTIONS */}
            {/* Array.from(voteGuardianState.voteOptionMap as Iterable<[string, string]>).map(([key, value]) => (
            <Typography key={key} data-testid="vote-guardian-option" minHeight={160} color="primary">
              {key}, {value}
            </Typography>
          )) */}
            {/* END VOTING OPTIONS */}

            {/* ADD VOTING QUESTION */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2, // Space between the TextField and Button
              }}
            >
              <CardContent
                sx={{
                  flex: 1, // Allow equal distribution
                  overflowY: 'auto', // Scroll if content overflows
                }}
              >
                <TextField
                  id="message-prompt2"
                  data-testid="vote-guardian-add-question-prompt"
                  variant="outlined"
                  focused
                  // fullWidth
                  // multiline
                  minRows={6}
                  maxRows={6}
                  placeholder="Add voting question"
                  size="small"
                  color="primary"
                  inputProps={{ style: { color: 'black' } }}
                  onChange={(e) => {
                    setMessagePrompt(e.target.value);
                  }}
                />
              </CardContent>
              <Button variant="contained" color="primary" size="small" onClick={onCreateVoting}>
                Add
              </Button>
            </Box>
            {/* END ADD VOTING QUESTION */}

            {/* ADD VOTING OPTION */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2, // Space between the TextField and Button
              }}
            >
              {/* η κάρτα του Message post */}
              <CardContent
                sx={{
                  flex: 1, // Allow equal distribution
                  overflowY: 'auto', // Scroll if content overflows
                }}
              >
                {/* {/* {boardState ? (
                boardState.state === STATE.occupied ? (
                  <Typography data-testid="board-posted-message" minHeight={160} color="primary">
                    {boardState.message}
                  </Typography>
                ) : ( */}
                <TextField
                  id="message-prompt"
                  data-testid="vote-guardian-add-option-prompt"
                  variant="outlined"
                  focused
                  // fullWidth
                  // multiline
                  minRows={6}
                  maxRows={6}
                  placeholder="Add option"
                  size="small"
                  color="primary"
                  inputProps={{ style: { color: 'black' } }}
                  onChange={(e) => {
                    setMessagePrompt(e.target.value);
                  }}
                />
                {/* )
              ) : (
                <Skeleton variant="rectangular" width={245} height={160} />
              )} */}
              </CardContent>
              <Button variant="contained" color="primary" size="small" onClick={onAddOption}>
                Add
              </Button>
            </Box>
            {/* END ADD VOTING OPTION */}

            {/* ADD VOTER */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2, // Space between the TextField and Button
              }}
            >
              {/* η κάρτα του Message post */}
              <CardContent
                sx={{
                  flex: 1, // Allow equal distribution
                  overflowY: 'auto', // Scroll if content overflows
                }}
              >
                {/* {/* {boardState ? (
                boardState.state === STATE.occupied ? (
                  <Typography data-testid="board-posted-message" minHeight={160} color="primary">
                    {boardState.message}
                  </Typography>
                ) : ( */}
                <TextField
                  id="message-prompt"
                  data-testid="vote-guardian-add-voter-prompt"
                  variant="outlined"
                  focused
                  // fullWidth
                  // multiline
                  minRows={6}
                  maxRows={6}
                  placeholder="Add voter's public key"
                  size="small"
                  color="primary"
                  inputProps={{ style: { color: 'black' } }}
                  onChange={(e) => {
                    setMessagePrompt(e.target.value);
                  }}
                />
                {/* )
              ) : (
                <Skeleton variant="rectangular" width={245} height={160} />
              )} */}
              </CardContent>
              <Button variant="contained" color="primary" size="small" onClick={onAddVoter}>
                Add
              </Button>
            </Box>
            {/* END ADD VOTER */}

            {/* CAST VOTE */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2, // Space between the TextField and Button
              }}
            >
              {/* η κάρτα του CAST A VOTE */}
              <CardContent
                sx={{
                  flex: 1, // Allow equal distribution
                  overflowY: 'auto', // Scroll if content overflows
                }}
              >
                {/* {/* {boardState ? (
                boardState.state === STATE.occupied ? (
                  <Typography data-testid="board-posted-message" minHeight={160} color="primary">
                    {boardState.message}
                  </Typography>
                ) : ( */}
                <TextField
                  id="message-prompt"
                  data-testid="vote-guardian-cast-vote-prompt"
                  variant="outlined"
                  focused
                  minRows={6}
                  maxRows={6}
                  placeholder="Cast a vote"
                  size="small"
                  color="primary"
                  inputProps={{ style: { color: 'black' } }}
                  onChange={(e) => {
                    setMessagePrompt(e.target.value);
                  }}
                />
                {/* )
              ) : (
                <Skeleton variant="rectangular" width={245} height={160} />
              )} */}
              </CardContent>
              <Button variant="contained" color="primary" size="small" onClick={onCastVote}>
                Add
              </Button>
            </Box>
            {/* END CAST VOTE */}
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
          </React.Fragment>
        )}
      </Card>
    </div>
  );
};

/** @internal */
const toShortFormatContractAddress = (contractAddress: ContractAddress | undefined): JSX.Element | undefined =>
  // Returns a new string made up of the first, and last, 8 characters of a given contract address.
  contractAddress ? (
    <span data-testid="vote-guardian-address">
      0x{contractAddress?.replace(/^[A-Fa-f0-9]{6}([A-Fa-f0-9]{8}).*([A-Fa-f0-9]{8})$/g, '$1...$2')}
    </span>
  ) : undefined;
