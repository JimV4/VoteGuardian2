import React, { useState } from 'react';
import axios from 'axios';
import { Button, Input, Card, CardContent, CardHeader } from '@mui/material';
import { type Signature, type SignedCredentialSubject } from '@midnight-ntwrk/university-contract';
import { useSignedCredentialSubject } from '../contexts/SignedCredentialSubjectContext';
import { utils } from '@midnight-ntwrk/vote-guardian-api';

export const IdentityVerification: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  let { signedCredentialSubject, setSignedCredentialSubject } = useSignedCredentialSubject();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    try {
      const response = await axios.post('http://localhost:3000/login', credentials);

      const signature: Signature = response.data.signature;
      const hashed_credential_str: string = response.data.msg;

      signedCredentialSubject = { hashed_credential: utils.hexToBytes(hashed_credential_str), signature };
      setSignedCredentialSubject(signedCredentialSubject);

      alert(`Login successful: ${JSON.stringify(response.data)}`);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
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
  );
};
