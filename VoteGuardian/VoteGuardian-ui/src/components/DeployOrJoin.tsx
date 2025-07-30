import React, { useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Button, CardActions, CardContent, IconButton, Stack, Typography } from '@mui/material';
import VoteGuardianAddIcon from '@mui/icons-material/PostAddOutlined';
import CreateVoteGuardianIcon from '@mui/icons-material/AddCircleOutlined';
import JoinVoteGuardianIcon from '@mui/icons-material/AddLinkOutlined';
import { TextPromptDialog } from './TextPromptDialog';
import crypto from 'crypto';
import { webcrypto } from 'crypto';
import { useDeployedVoteGuardianContext } from '../hooks';
import { useDhSecretKey } from '../contexts/DhSecretKeyContext';
import { Backdrop, CircularProgress } from '@mui/material';
import StopIcon from '@mui/icons-material/HighlightOffOutlined';

const subtle = window.crypto.subtle;

const serverUrl = process.env.REACT_APP_API_URL;

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

// const voteGuardianApiProvider = useDeployedVoteGuardianContext();

/**
 * The props required by the {@link DeployOrJoinProps} component.
 *
 * @internal
 */
export interface DeployOrJoinProps {
  /** A callback that will be called to create a new bulletin voteGuardian. */
  onCreateVoteGuardianCallback: (dhSecretKey: string) => void;
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
  const [dhSecretKey, setDhSecretKey] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const { setSecretKey } = useDhSecretKey();
  const [loading, setLoading] = useState(false);

  const onDiffieHellmanKeyExchange = async (): Promise<void> => {
    try {
      setLoading(true);
      const userKeys = await generateKeys();
      const ecdhPubRaw = await subtle.exportKey('spki', userKeys.ecdh.publicKey);
      const signature = await signData(userKeys.ecdsa.privateKey, ecdhPubRaw);

      const res = await fetch('http://localhost:3000/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ecdhPub: arrayBufferToBase64(ecdhPubRaw),
          ecdsaPub: await exportKeyBase64(userKeys.ecdsa.publicKey),
          signature,
        }),
      });

      const data = await res.json();

      if (res.status !== 200) {
        console.error('Server error:', data.error);
        return;
      }

      // Verify server response
      const universityECDSAPub = await subtle.importKey(
        'spki',
        base64ToArrayBuffer(data.ecdsaPub),
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['verify'],
      );

      const valid = await subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        universityECDSAPub,
        base64ToArrayBuffer(data.signature),
        base64ToArrayBuffer(data.ecdhPub),
      );

      if (!valid) {
        throw new Error('University signature verification failed');
      }

      // ✅ Import the university’s ECDH public key
      const universityECDHPub = await subtle.importKey(
        'spki',
        base64ToArrayBuffer(data.ecdhPub),
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        [],
      );
      // const universityECDHPub = await importKey(data.ecdhPub, 'ECDH');
      console.log('after generate 10');
      const sharedSecret = await deriveSharedSecret(userKeys.ecdh.privateKey, universityECDHPub);
      const sharedSecretHex = Buffer.from(sharedSecret).toString('hex');
      console.log('Derived shared secret (hex):', sharedSecretHex);
      setDhSecretKey(sharedSecretHex);
      setSecretKey(sharedSecretHex);
    } catch (err) {
      setErrorMessage(String(err));
      console.error(err);
    } finally {
      setLoading(false); // stop spinner
    }
    // await voteGuardianApiProvider.setPrivateStateSecretKey(sharedSecretHex);
  };

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
            onClick={() => {
              onCreateVoteGuardianCallback(dhSecretKey);
            }}
            data-testid="vote-guardian-deploy-btn"
          >
            Deploy New Contract
          </Button>
        )}

        {isOrganizer === 'yes' && (
          <Button variant="contained" color="primary" size="medium" onClick={onDiffieHellmanKeyExchange}>
            DH KEY EXCHANGE
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
      <Backdrop
        sx={{
          position: 'absolute',
          color: '#fff',
          width: '100%', // Full width of the Card
          height: '100%',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={loading}
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
    </>
  );
};
