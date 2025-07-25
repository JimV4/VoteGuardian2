import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum VOTE_STATE { open = 0, closed = 1 }

export type Maybe<a> = { is_some: boolean; value: a };

export type Witnesses<T> = {
  local_secret_key(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
  find_voter_public_key(context: __compactRuntime.WitnessContext<Ledger, T>,
                        voter_public_key_0: Uint8Array): [T, { leaf: Uint8Array,
                                                               path: { sibling: { field: bigint
                                                                                },
                                                                       goes_left: boolean
                                                                     }[]
                                                             }];
}

export type ImpureCircuits<T> = {
  add_voter(context: __compactRuntime.CircuitContext<T>,
            voter_public_key_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  record_payment_key(context: __compactRuntime.CircuitContext<T>,
                     voter_public_key_0: Uint8Array,
                     voter_public_payment_key_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  cast_vote(context: __compactRuntime.CircuitContext<T>, vote_option_0: string): __compactRuntime.CircuitResults<T, []>;
  close_voting(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  open_voting(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  create_voting(context: __compactRuntime.CircuitContext<T>, vq_0: string): __compactRuntime.CircuitResults<T, []>;
  add_option(context: __compactRuntime.CircuitContext<T>,
             vote_option_0: string,
             i_0: string): __compactRuntime.CircuitResults<T, []>;
}

export type PureCircuits = {
  public_key(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<T> = {
  add_voter(context: __compactRuntime.CircuitContext<T>,
            voter_public_key_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  record_payment_key(context: __compactRuntime.CircuitContext<T>,
                     voter_public_key_0: Uint8Array,
                     voter_public_payment_key_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  cast_vote(context: __compactRuntime.CircuitContext<T>, vote_option_0: string): __compactRuntime.CircuitResults<T, []>;
  close_voting(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  open_voting(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  create_voting(context: __compactRuntime.CircuitContext<T>, vq_0: string): __compactRuntime.CircuitResults<T, []>;
  add_option(context: __compactRuntime.CircuitContext<T>,
             vote_option_0: string,
             i_0: string): __compactRuntime.CircuitResults<T, []>;
  public_key(context: __compactRuntime.CircuitContext<T>, sk_0: Uint8Array): __compactRuntime.CircuitResults<T, Uint8Array>;
}

export type Ledger = {
  readonly votingOrganizer: Uint8Array;
  readonly voteState: VOTE_STATE;
  eligibleVoters: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  votingNulifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  votesList: {
    isEmpty(): boolean;
    length(): bigint;
    head(): Maybe<string>;
    [Symbol.iterator](): Iterator<string>
  };
  readonly voteCount: bigint;
  readonly voteQuestion: string;
  mapPublicPayment: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  voteOptionMap: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: string): boolean;
    lookup(key_0: string): string;
    [Symbol.iterator](): Iterator<[string, string]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
