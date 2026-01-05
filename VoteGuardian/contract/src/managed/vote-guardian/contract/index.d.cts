import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum VOTE_STATE { open = 0, closed = 1 }

export type Witnesses<T> = {
  local_secret_key(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
  find_voter_public_key(context: __compactRuntime.WitnessContext<Ledger, T>,
                        voter_public_key_0: Uint8Array): [T, { leaf: Uint8Array,
                                                               path: { sibling: { field: bigint
                                                                                },
                                                                       goes_left: boolean
                                                                     }[]
                                                             }];
  secret_vote(context: __compactRuntime.WitnessContext<Ledger, T>,
              voting_id_0: Uint8Array): [T, Uint8Array];
}

export type ImpureCircuits<T> = {
  create_voting(context: __compactRuntime.CircuitContext<T>,
                publish_vote_expiration_time_v_0: bigint,
                cast_vote_expiration_time_v_0: bigint): __compactRuntime.CircuitResults<T, []>;
  edit_question(context: __compactRuntime.CircuitContext<T>,
                voting_id_0: Uint8Array,
                voting_question_0: string): __compactRuntime.CircuitResults<T, []>;
  add_option(context: __compactRuntime.CircuitContext<T>,
             voting_id_0: Uint8Array,
             vote_option_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  close_voting(context: __compactRuntime.CircuitContext<T>,
               voting_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  open_voting(context: __compactRuntime.CircuitContext<T>,
              voting_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  cast_vote(context: __compactRuntime.CircuitContext<T>, voting_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  publish_vote(context: __compactRuntime.CircuitContext<T>,
               voting_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  create_voting(context: __compactRuntime.CircuitContext<T>,
                publish_vote_expiration_time_v_0: bigint,
                cast_vote_expiration_time_v_0: bigint): __compactRuntime.CircuitResults<T, []>;
  edit_question(context: __compactRuntime.CircuitContext<T>,
                voting_id_0: Uint8Array,
                voting_question_0: string): __compactRuntime.CircuitResults<T, []>;
  add_option(context: __compactRuntime.CircuitContext<T>,
             voting_id_0: Uint8Array,
             vote_option_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  close_voting(context: __compactRuntime.CircuitContext<T>,
               voting_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  open_voting(context: __compactRuntime.CircuitContext<T>,
              voting_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  cast_vote(context: __compactRuntime.CircuitContext<T>, voting_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  publish_vote(context: __compactRuntime.CircuitContext<T>,
               voting_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
}

export type Ledger = {
  readonly count: bigint;
  readonly university_public_key: Uint8Array;
  votings: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  voting_options: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): {
      isEmpty(): boolean;
      size(): bigint;
      member(elem_0: Uint8Array): boolean;
      [Symbol.iterator](): Iterator<Uint8Array>
    }
  };
  voting_questions: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): string;
    [Symbol.iterator](): Iterator<[Uint8Array, string]>
  };
  voting_results: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): {
      isEmpty(): boolean;
      size(): bigint;
      member(key_1: Uint8Array): boolean;
      lookup(key_1: Uint8Array): { read(): bigint }
    }
  };
  eligible_voters: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  voting_states: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): VOTE_STATE;
    [Symbol.iterator](): Iterator<[Uint8Array, VOTE_STATE]>
  };
  voting_nulifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  publish_voting_nulifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  voting_organizers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  hashed_votes: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  publish_vote_expiration_time: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  cast_vote_expiration_time: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>,
               eligible_voter_public_keys_0: Uint8Array[]): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
