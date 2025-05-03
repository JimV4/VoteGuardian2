/**
 * VoteGuardian common types and abstractions.
 *
 * @module
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
// τύποι που γίνονται import από τα αρχεία witnesses.ts και index.d.cts
import type {
  VOTE_STATE,
  VoteGuardianPrivateState,
  Contract,
  Witnesses,
  Ledger,
} from '@midnight-ntwrk/vote-guardian-contract';

/**
 * The private states consumed throughout the application.
 *
 * @remarks
 * {@link PrivateStates} can be thought of as a type that describes a schema for all
 * private states for all contracts used in the application. Each key represents
 * the type of private state consumed by a particular type of contract.
 * The key is used by the deployed contract when interacting with a private state provider,
 * and the type (i.e., `typeof PrivateStates[K]`) represents the type of private state
 * expected to be returned.
 *
 * Since there is only one contract type for the bulletin board example, we only define a
 * single key/type in the schema.
 *
 * @public
 */
export type PrivateStates = {
  /**
   * Key used to provide the private state for {@link VoteGuardianContract} deployments.
   */
  readonly voteGuardianPrivateState: VoteGuardianPrivateState;
};

/**
 * Represents a VoteGuardian contract and its private state.
 *
 * @public
 */
// ο τύπος Contract έρχεται από το αρχείο index.d.cts. Ο τύπος VoteGuardianPrivateState από το αρχείο witnesses.ts και ο
// τύπος Witnesses έρχεται από το αρχείο index.d.cts
export type VoteGuardianContract = Contract<VoteGuardianPrivateState, Witnesses<VoteGuardianPrivateState>>;

/**
 * The keys of the circuits exported from {@link VoteGuardianContract}.
 *
 * @public
 */
export type VoteGuardianCircuitKeys = Exclude<keyof VoteGuardianContract['impureCircuits'], number | symbol>;

/**
 * The providers required by {@link VoteGuardianContract}.
 *
 * @public
 */
// Ο τύπος MidnightProviders έρχεται από τη βιβλιοθήκη
export type VoteGuardianProviders = MidnightProviders<VoteGuardianCircuitKeys, PrivateStates>;

/**
 * A {@link VoteGuardianContract} that has been deployed to the network.
 *
 * @public
 */
// Ο τύπος FoundContract έρχεται από τη βιβλιοθήκη. Το DeployedVoteGuardianContract είναι απλώς alias για το FoundContract
export type DeployedVoteGuardianContract = FoundContract<VoteGuardianPrivateState, VoteGuardianContract>;

/**
 * A type that represents the derived combination of public (or ledger), and private state.
 */
export type VoteGuardianDerivedState = {
  // ο τύπος VOTE_STATE έρχεται από το αρχείο index.d.cts
  readonly voteState: VOTE_STATE;

  // Τα αντίστοιχα πεδία πα΄ίρνουν τους τύπους τους από τους αντίστοιχους τύπους του Ledger, το οποίο γίνεται defined
  // στο contract/index.d.cts και γίνεται import εδώ πέρα
  // readonly votersMap: Ledger['votersMap'];
  readonly votesList: Ledger['votesList'];
  readonly voteCount: bigint;
  readonly voteQuestion: string;
  readonly mapPublicPayment: Ledger['mapPublicPayment'];
  readonly voteOptionMap: Ledger['voteOptionMap'];

  /**
   * A readonly flag that determines if the current message was posted by the current user.
   *
   * @remarks
   * The `poster` property of the public (or ledger) state is the public key of the message poster, while
   * the `secretKey` property of {@link VoteGuardianPrivateState} is the secret key of the current user. If
   * `poster` corresponds to `secretKey`, then `isOwner` is `true`.
   */
  // readonly isOwner: boolean;
};
