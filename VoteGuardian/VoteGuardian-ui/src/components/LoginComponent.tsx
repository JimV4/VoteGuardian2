import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import WriteIcon from '@mui/icons-material/EditNoteOutlined';
import CopyIcon from '@mui/icons-material/ContentPasteOutlined';
import StopIcon from '@mui/icons-material/HighlightOffOutlined';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';

const serverUrl = process.env.REACT_APP_API_URL;

export const LoginComponent: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [messagePrompt, setMessagePrompt] = useState<string>();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string>();
  const navigate = useNavigate();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };
  async function sha256(input: Uint8Array) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', input);
    return new Uint8Array(hashBuffer);
  }

  function randomUint8Array() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return arr;
  }

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    setMessage(null);
    const arr = randomUint8Array();

    const publicKeyArr = await sha256(arr);
    const publicKey = toHex(publicKeyArr);
    const sk = toHex(arr);
    setSecretKey(sk);
    console.log(sk);
    try {
      const input = {
        subject: {
          username: credentials.username,
          password: credentials.password,
          publicKey,
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
      const data = await response.json();
      if (!response.ok) {
        setError(data.message);
      } else {
        if (response.status === 201) {
          // 2. Use Template Literals (backticks) to combine the strings
          const successText = data.message || 'Credential stored successfully';
          setMessage(`${successText} Your credential is: ${sk}. Store it somewhere safe.`);
        } else {
          setMessage(data.message);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        className="font-bold mt-10 text-black"
        sx={{ color: 'black' }}
      >
        Welcome to the VoteGuardian dapp!
      </Typography>
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
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <Button onClick={handleSubmit} className="w-full bg-blue-600 text-white rounded-lg p-2">
            Login
          </Button>
        </CardContent>
      </Card>
      {/* Server Success Message */}
      {message && (
        <Typography
          variant="body2"
          align="center"
          sx={{
            color: '#4caf50', // Success green
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            p: 1,
            borderRadius: 1,
          }}
        >
          {message}
        </Typography>
      )}

      {/* Server Error Message */}
      {error && (
        <Typography
          variant="body2"
          align="center"
          sx={{
            color: '#f44336', // Error red
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            p: 1,
            borderRadius: 1,
          }}
        >
          {error}
        </Typography>
      )}
    </div>
  );
};
function sha256(secretKey: string) {
  throw new Error('Function not implemented.');
}
