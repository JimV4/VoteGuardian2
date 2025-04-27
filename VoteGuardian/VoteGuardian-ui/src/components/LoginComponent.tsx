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

export const LoginComponent: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [messagePrompt, setMessagePrompt] = useState<string>();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    try {
      const input = {
        subject: {
          username: credentials.username,
          password: credentials.password,
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

      navigate('/home', { state: { isOrganizer: data.isOrganizer } });
      // const response = await axios.post('http://localhost:3000/login', { subject: credentials });
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
    </div>
  );
};
