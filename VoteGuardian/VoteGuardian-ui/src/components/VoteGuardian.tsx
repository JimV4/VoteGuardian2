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
import crypto from 'crypto';
import { webcrypto } from 'crypto';

const subtle = window.crypto.subtle;

const serverUrl = process.env.REACT_APP_API_URL;

/** The props required by the {@link VoteGuardian} component. */
export interface VoteGuardianProps {
  /** The observable bulletin voteGuardian deployment. */
  voteGuardianDeployment$?: Observable<VoteGuardianDeployment>;
  isOrganizer: string;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return Uint8Array.from(Buffer.from(base64, 'base64')).buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64');
}

async function generateKeys(): Promise<{
  ecdh: webcrypto.CryptoKeyPair;
  ecdsa: webcrypto.CryptoKeyPair;
}> {
  console.log('inside1');
  const ecdh = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  console.log('inside2');
  const ecdsa = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  console.log('inside3');
  return { ecdh, ecdsa };
}

async function exportKeyBase64(key: CryptoKey): Promise<string> {
  const spki = await subtle.exportKey('spki', key);
  return arrayBufferToBase64(spki);
}

async function signData(privateKey: CryptoKey, data: ArrayBuffer): Promise<string> {
  return arrayBufferToBase64(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data));
}

async function importKey(spkiBase64: string, type: 'ECDSA' | 'ECDH'): Promise<CryptoKey> {
  const spki = base64ToArrayBuffer(spkiBase64);
  return await subtle.importKey('spki', spki, { name: type, namedCurve: 'P-256' }, true, ['verify']);
}

async function deriveSharedSecret(privateKey: CryptoKey, theirPublicKey: CryptoKey): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: theirPublicKey }, privateKey, 256));
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
  const [messagePrompt, setMessagePrompt] = useState<string>();
  const [isWorking, setIsWorking] = useState(!!voteGuardianDeployment$);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [voteGuardianState, setVoteGuardianState] = useState<VoteGuardianDerivedState>();

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

  const onCopyContractAddress = useCallback(async () => {
    if (deployedVoteGuardianAPI) {
      await navigator.clipboard.writeText(deployedVoteGuardianAPI.deployedContractAddress);
    }
  }, [deployedVoteGuardianAPI]);

  return (
    <div style={{ transform: 'scale(1.2)', transformOrigin: 'top left' }}>
      <Card
        sx={{ position: 'relative', width: 460, maxHeight: 495, minWidth: 460, minHeight: 495, overflowY: 'auto' }}
        color="primary"
      >
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
