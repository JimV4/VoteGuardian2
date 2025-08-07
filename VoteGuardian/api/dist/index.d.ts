/**
 * Provides types and utilities for working with VoteGuardian contracts.
 *
 * @packageDocumentation
 */
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import type { VoteGuardianDerivedState, VoteGuardianProviders, DeployedVoteGuardianContract } from './common-types.js';
import { type Observable } from 'rxjs';
/**
 * An API for a deployed VoteGuardian.
 */
export interface DeployedVoteGuardianAPI {
    readonly deployedContractAddress: ContractAddress;
    readonly state$: Observable<VoteGuardianDerivedState>;
    cast_vote: (voting_id: Uint8Array, encrypted_vote: string) => Promise<void>;
    close_voting: (voting_id: Uint8Array) => Promise<void>;
    open_voting: (voting_id: Uint8Array) => Promise<void>;
    create_voting: (vote_question: string) => Promise<void>;
    add_option: (voting_id: Uint8Array, vote_option: string, index: string) => Promise<void>;
}
/**
 * Provides an implementation of {@link DeployedVoteGuardianAPI} by adapting a deployed Vote Guardian
 * contract
 *
 * @remarks
 * The `VoteGuardianPrivateState` is managed at the DApp level by a private state provider. As such, this
 * private state is shared between all instances of {@link VoteGuardianAPI}, and their underlying deployed
 * contracts. The private state defines a `'secretKey'` property that effectively identifies the current
 * user, and is used to determine if the current user is the poster of the message as the observable
 * contract state changes.
 *
 * In the future, Midnight.js will provide a private state provider that supports private state storage
 * keyed by contract address. This will remove the current workaround of sharing private state across
 * the deployed bulletin board contracts, and allows for a unique secret key to be generated for each bulletin
 * board that the user interacts with.
 */
export declare class VoteGuardianAPI implements DeployedVoteGuardianAPI {
    readonly deployedContract: DeployedVoteGuardianContract;
    private readonly logger?;
    /** @internal */
    private constructor();
    /**
     * Gets the address of the current deployed contract.
     */
    readonly deployedContractAddress: ContractAddress;
    /**
     * Gets an observable stream of state changes based on the current public (ledger),
     * and private state data.
     */
    readonly state$: Observable<VoteGuardianDerivedState>;
    add_option(voting_id: Uint8Array, vote_option: string, index: string): Promise<void>;
    /**
     * Attempts to caste a vote .
     *
     * @param encrypted_vote The vote to be casted.
     *
     * @remarks
     * This method can fail during local circuit execution if the voting is not open or the user has already voted.
     */
    cast_vote(voting_id: Uint8Array, encrypted_vote: string): Promise<void>;
    /**
     * Attempts to caste a vote .
     *
     * @param encrypted_vote The vote to be casted.
     *
     * @remarks
     * This method can fail during local circuit execution if the voting is not open.
     */
    close_voting(voting_id: Uint8Array): Promise<void>;
    open_voting(voting_id: Uint8Array): Promise<void>;
    create_voting(vote_question: string): Promise<void>;
    /**
     * Attempts to  count all the votes.
     *
     * @remarks
     * This method can fail during local circuit execution if the voting has not yet closed.
     */
    /**
     * Deploys a new VoteGuardian contract to the network.
     *
     * @param providers The bulletin board providers.
     * @param logger An optional 'pino' logger to use for logging.
     * @returns A `Promise` that resolves with a {@link VoteGuardianAPI} instance that manages the newly deployed
     * {@link DeployedVoteGuardianContract}; or rejects with a deployment error.
     */
    static deploy(providers: VoteGuardianProviders, secretKey: string, eligibleVoterPublicKeys: Uint8Array[], logger?: Logger): Promise<VoteGuardianAPI | null>;
    /**
     * Finds an already deployed bulletin board contract on the network, and joins it.
     *
     * @param providers The bulletin board providers.
     * @param contractAddress The contract address of the deployed bulletin board contract to search for and join.
     * @param logger An optional 'pino' logger to use for logging.
     * @returns A `Promise` that resolves with a {@link VoteGuardianAPI} instance that manages the joined
     * {@link DeployedVoteGuardianContract}; or rejects with an error.
     */
    static join(providers: VoteGuardianProviders, contractAddress: ContractAddress, secretKey: string, logger?: Logger): Promise<VoteGuardianAPI>;
}
/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';
export * from './common-types.js';
