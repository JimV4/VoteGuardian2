/**
 * VoteGuardian common types and abstractions.
 *
 * @module
 */
import { PrivateStateProvider, type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { VoteGuardianPrivateState, Contract, Witnesses, Ledger } from '@midnight-ntwrk/vote-guardian-contract';
import { Voting } from './Voting';
export declare function inMemoryPrivateStateProvider<PSI extends string = string, PS = any>(): PrivateStateProvider<PSI, PS>;
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
export type VoteGuardianProviders = MidnightProviders<VoteGuardianCircuitKeys, 'voteGuardianPrivateState', VoteGuardianPrivateState>;
/**
 * A {@link VoteGuardianContract} that has been deployed to the network.
 *
 * @public
 */
export type DeployedVoteGuardianContract = FoundContract<VoteGuardianContract>;
/**
 * A type that represents the derived combination of public (or ledger), and private state.
 */
export type VoteGuardianDerivedState = {
    readonly votings: Ledger['votings'];
    readonly votingQuestions: Ledger['voting_questions'];
    readonly votingOptions: Ledger['voting_options'];
    readonly votingResults: Ledger['voting_results'];
    readonly eligibleVoters: Ledger['eligible_voters'];
    readonly votingStates: Ledger['voting_states'];
    readonly votingNulifiers: Ledger['voting_nulifiers'];
    readonly votingOrganizers: Ledger['voting_organizers'];
    readonly votingList: Voting[];
};
