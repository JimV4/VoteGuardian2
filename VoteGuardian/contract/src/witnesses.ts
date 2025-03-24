/*
 * This file defines the shape of the bulletin board's private state,
 * as well as the single witness function that accesses it.
 */

import { Ledger, Maybe, ledger } from './managed/vote-guardian/contract/index.cjs';
import { MerkleTreePath, WitnessContext } from '@midnight-ntwrk/compact-runtime';
import { type SignedCredentialSubject, type Signature } from '@midnight-ntwrk/university-contract';

/* **********************************************************************
 * The only hidden state needed by the VoteGuardian contract is
 * the user's secret key. This is the secret key of the user that votes.
 *  Some of the library code and
 * compiler-generated code is parameterized by the type of our
 * private state, so we define a type for it and a function to
 * make an object of that type.
 */

export type VoteGuardianPrivateState = {
  readonly signedCredentialSubject?: SignedCredentialSubject;
};

// φτιάχνει objects τύπου VoteGuardianPrivateState
export const createVoteGuardianPrivateState = () => ({
  signedCredentialSubject: undefined,
});

export const createVoteGuardianPrivateState2 = (pSignedCredentialSubject: SignedCredentialSubject): SignedCredentialSubject =>
  pSignedCredentialSubject;

/* **********************************************************************
 * The witnesses object for the bulletin board contract is an object
 * with a field for each witness function, mapping the name of the function
 * to its implementation.
 *
 * The implementation of each function always takes as its first argument
 * a value of type WitnessContext<L, PS>, where L is the ledger object type
 * that corresponds to the ledger declaration in the Compact code, and PS
 *  is the private state type, like BBoardPrivateState defined above.
 *
 * A WitnessContext has three
 * fields:
 *  - ledger: T
 *  - privateState: PS
 *  - contractAddress: string
 *
 * The other arguments (after the first) to each witness function
 * correspond to the ones declared in Compact for the witness function.
 * The function's return value is a tuple of the new private state and
 * the declared return value.  In this case, that's a BBoardPrivateState
 * and a Uint8Array (because the contract declared a return value of Bytes[32],
 * and that's a Uint8Array in TypeScript).
 *
 * The local_secret_key witness does not need the ledger or contractAddress
 * from the WitnessContext, so it uses the parameter notation that puts
 * only the binding for the privateState in scope.
 */

// Από την στιγμή που έχω μόνο έναν witness στο contract τότε έχω μόνο ένα πεδίο σε αυτό το object. Αν είχα κι άλλο
// witness στο VoteGuardian.compact τότε θα υπήρχε αντίστοιχα κι άλλο πεδίο στο object με το ίδιο όνομα
export const witnesses = {
  // συνάρτηση που παίρνει ως ΄όρισμα ένα WitnessContext. Επιστρέφει μια τούπλα με το νέο private state
  // και το νέο secret key του poster
  // εδώ το Ledger προέρχεται από το index.d.cts που παράγει ο compiler και το VoteGuardianPrivateState προέρχεται από πάνω
  // το local_secret_key ΔΕΝ αλλάζει το private state
  local_signed_credential_subject: ({
    privateState,
    ledger,
  }: WitnessContext<Ledger, VoteGuardianPrivateState>): [VoteGuardianPrivateState, SignedCredentialSubject] => {
    if (privateState.signedCredentialSubject) {
      return [privateState, privateState.signedCredentialSubject];
    } else throw new Error('No identity found');
  },

  // find_voter_public_key: (
  //   { privateState, ledger }: WitnessContext<Ledger, VoteGuardianPrivateState>,
  //   item: Uint8Array,
  // ): [VoteGuardianPrivateState, MerkleTreePath<Uint8Array>] => [
  //   createVoteGuardianPrivateState(privateState.secretKey, ledger.eligibleVoters.findPathForLeaf(item)!),
  //   ledger.eligibleVoters.findPathForLeaf(item)!,
  // ],
};
