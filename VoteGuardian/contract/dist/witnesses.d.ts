import { Ledger } from './managed/vote-guardian/contract/index.cjs';
import { MerkleTreePath, WitnessContext } from '@midnight-ntwrk/compact-runtime';
export type VoteGuardianPrivateState = {
    readonly secretKey: Uint8Array;
    voterPublicKeyPath: MerkleTreePath<Uint8Array>;
};
export declare const createVoteGuardianPrivateState: (secretKey: Uint8Array, voterPublicKeyPath: MerkleTreePath<Uint8Array>) => {
    secretKey: Uint8Array<ArrayBufferLike>;
    voterPublicKeyPath: MerkleTreePath<Uint8Array<ArrayBufferLike>>;
};
export declare const witnesses: {
    local_secret_key: ({ privateState, ledger, }: WitnessContext<Ledger, VoteGuardianPrivateState>) => [VoteGuardianPrivateState, Uint8Array];
    find_voter_public_key: ({ privateState, ledger }: WitnessContext<Ledger, VoteGuardianPrivateState>, item: Uint8Array) => [VoteGuardianPrivateState, MerkleTreePath<Uint8Array>];
};
