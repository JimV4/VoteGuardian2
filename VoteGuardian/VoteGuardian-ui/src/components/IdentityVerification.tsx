import React, { useState } from 'react';
import axios from 'axios';
import { Button, Input } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Signature, type SignedCredentialSubject } from '@midnight-ntwrk/university-compact';
import { useSignedCredentialSubject } from '../contexts/SignedCredentialSubjectContext';

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
      const hashed_credential: string = response.data.msg;

      signedCredentialSubject = { hashed_credential, signature };
      setSignedCredentialSubject(signedCredentialSubject);

      alert(`Login successful: ${JSON.stringify(response.data)}`);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <Card className="max-w-md mx-auto p-6 mt-10 shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Identity Verification</CardTitle>
      </CardHeader>
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
