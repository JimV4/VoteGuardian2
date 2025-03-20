import React, { type PropsWithChildren, createContext, useState, useContext } from 'react';
import { type SignedCredentialSubject, type Signature } from '@midnight-ntwrk/university-contract';

const SignedCredentialSubjectContext = createContext<SignedCredentialSubject | null>(null);

export const useSignedCredentialSubject = (): SignedCredentialSubject => {
  const signedCredentialSubject = useContext(SignedCredentialSubjectContext);
  if (!signedCredentialSubject) {
    throw new Error('Signed Credential not Found');
  }
  return signedCredentialSubject;
};

export const SignedCredentialSubjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [credential, setCredential] = useState<SignedCredentialSubject | null>(null);

  return (
    <SignedCredentialSubjectContext.Provider value={{ credential, setCredential }}>
      {children}
    </SignedCredentialSubjectContext.Provider>
  );
};
