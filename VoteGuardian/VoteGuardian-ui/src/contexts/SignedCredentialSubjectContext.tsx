import React, { type PropsWithChildren, createContext, useState, useContext } from 'react';
import { type SignedCredentialSubject, type Signature } from '@midnight-ntwrk/university-contract';

const SignedCredentialSubjectContext = createContext<SignedCredentialSubject | null>(null);

export const useSignedCredentialSubject = (): SignedCredentialSubject => {
  const context = useContext(SignedCredentialSubjectContext);
  if (!context) {
    throw new Error('Signed Credential not Found');
  }
  return context;
};

export const SignedCredentialSubjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [signedCredentialSubject, setSignedCredentialSubject] = useState<SignedCredentialSubject | null>(null);

  return (
    <SignedCredentialSubjectContext.Provider value={{ signedCredentialSubject, setSignedCredentialSubject }}>
      {children}
    </SignedCredentialSubjectContext.Provider>
  );
};
