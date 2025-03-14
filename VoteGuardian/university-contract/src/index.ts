import { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Contract as ContractType, Ledger, Witnesses } from './managed/contract/index.cjs';
import ContractModule from './managed/contract/index.cjs';

export * from './managed/identity/contract/index.cjs';
export const ledger = ContractModule.ledger;
export const pureCircuits = ContractModule.pureCircuits;
export const { Contract } = ContractModule;
export type Contract<T, W extends Witnesses<T> = Witnesses<T>> = ContractType<T, W>;

export type UniversityPrivateState = {
  readonly localSecretKey: Uint8Array;
};

export const createUniversityPrivateState = (localSecretKey: Uint8Array) => ({
  localSecretKey,
});

export const witnesses = {
  local_secret_key: ({ privateState }: WitnessContext<Ledger, UniversityPrivateState>): [UniversityPrivateState, Uint8Array] => [
    privateState,
    privateState.localSecretKey,
  ],
};
