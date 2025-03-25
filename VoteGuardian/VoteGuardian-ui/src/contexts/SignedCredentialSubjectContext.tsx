import React, { type PropsWithChildren, createContext, useState, useContext } from 'react';
import { type SignedCredentialSubject, type Signature } from '@midnight-ntwrk/university-contract';

interface SignedCredentialSubjectContextType {
  signedCredentialSubject: SignedCredentialSubject | undefined;
  setSignedCredentialSubject: React.Dispatch<React.SetStateAction<SignedCredentialSubject | undefined>>;
}

const SignedCredentialSubjectContext = createContext<SignedCredentialSubjectContextType | null>(null);

export const useSignedCredentialSubject = (): SignedCredentialSubjectContextType => {
  const context = useContext(SignedCredentialSubjectContext);
  if (!context) {
    throw new Error('Signed Credential not Found');
  }
  return context;
};

export const SignedCredentialSubjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [signedCredentialSubject, setSignedCredentialSubject] = useState<SignedCredentialSubject | undefined>(
    undefined,
  );

  return (
    <SignedCredentialSubjectContext.Provider value={{ signedCredentialSubject, setSignedCredentialSubject }}>
      {children}
    </SignedCredentialSubjectContext.Provider>
  );
};
