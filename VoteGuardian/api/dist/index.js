/**
 * Provides types and utilities for working with VoteGuardian contracts.
 *
 * @packageDocumentation
 */
import { Contract, createVoteGuardianPrivateState, ledger, pureCircuits, witnesses, VOTE_STATE, } from '@midnight-ntwrk/vote-guardian-contract';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
/** @internal */
// ο τύπος Contract έρχεται από το αρχείο index.d.cts. Το witnesses έρχεται από το αρχείο witnesses.ts
const VoteGuardianContractInstance = new Contract(witnesses);
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
// TODO: Update VoteGuardianAPI to use contract level private state storage.
export class VoteGuardianAPI {
    deployedContract;
    logger;
    /** @internal */
    constructor(
    // θυμίζω ΄ότι το DeployedVoteGuardianContract είναι alias gia FoundContract
    deployedContract, providers, logger) {
        this.deployedContract = deployedContract;
        this.logger = logger;
        this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
        this.state$ = combineLatest([
            // Combine public (ledger) state with...
            providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(map((contractState) => ledger(contractState.data)), tap((ledgerState) => logger?.trace({
                ledgerStateChanged: {
                    ledgerState: {
                        ...ledgerState,
                        // state: ledgerState.state === STATE.occupied ? 'occupied' : 'vacant',
                        voteState: () => {
                            if (ledgerState.voteState === VOTE_STATE.open) {
                                return 'open';
                            }
                            else if (ledgerState.voteState === VOTE_STATE.closed) {
                                return 'closed';
                            }
                        },
                        // votersMap: ledgerState.votersMap,
                        // votesList: ledgerState.votesList,
                        // voteCountForEachOption: ledgerState.voteCountForEachOption,
                        // voteCount: ledgerState.voteCount,
                        // poster: toHex(ledgerState.poster),
                    },
                },
            }))),
            // ...private state...
            //    since the private state of the bulletin board application never changes, we can query the
            //    private state once and always use the same value with `combineLatest`. In applications
            //    where the private state is expected to change, we would need to make this an `Observable`.
            from(providers.privateStateProvider.get('voteGuardianPrivateState')),
        ], 
        // ...and combine them to produce the required derived state.
        (ledgerState, privateState) => {
            const hashedSecretKey = pureCircuits.public_key(privateState.secretKey);
            return {
                voteState: ledgerState.voteState,
                // votersMap: ledgerState.votersMap,
                eligibleVoters: ledgerState.eligibleVoters,
                votesList: ledgerState.votesList,
                voteCount: ledgerState.voteCount,
                voteQuestion: ledgerState.voteQuestion,
                mapPublicPayment: ledgerState.mapPublicPayment,
                voteOptionMap: ledgerState.voteOptionMap,
                isOrganizer: toHex(ledgerState.votingOrganizer) === toHex(hashedSecretKey),
            };
        });
    }
    /**
     * Gets the address of the current deployed contract.
     */
    deployedContractAddress;
    /**
     * Gets an observable stream of state changes based on the current public (ledger),
     * and private state data.
     */
    state$;
    /**
     * Attempts to add a voter .
     *
     * @param encrypted_vote The voter's key to be added.
     *
     * @remarks
     * This method can fail during local circuit execution if the voting is not open.
     */
    async record_payment_key(voter_public_key, voter_public_payment_key) {
        try {
            this.logger?.info('record payment key');
            const txData = await this.deployedContract.callTx.record_payment_key(voter_public_key, voter_public_payment_key);
            this.logger?.trace({
                transactionAdded: {
                    circuit: 'record_payment_key',
                    txHash: txData.public.txHash,
                    blockHeight: txData.public.blockHeight,
                },
            });
        }
        catch (error) {
            console.log('asdasdasad');
            console.log(error.message);
            console.log(error.stack);
            console.log(error);
            // Log the full exception, including stack trace if available.
            this.logger?.error('Error record_payment_key...', {
                message: error.message,
                stack: error.stack,
                details: error, // Capture additional details if the error is a custom object.
            });
        }
    }
    async add_voter(voter_public_key) {
        try {
            this.logger?.info('adding voter');
            const txData = await this.deployedContract.callTx.add_voter(voter_public_key);
            this.logger?.trace({
                transactionAdded: {
                    circuit: 'add_voter',
                    txHash: txData.public.txHash,
                    blockHeight: txData.public.blockHeight,
                },
            });
        }
        catch (error) {
            console.log('asdasdasad');
            console.log(error.message);
            console.log(error.stack);
            console.log(error);
            // Log the full exception, including stack trace if available.
            this.logger?.error('Error adding voter...', {
                message: error.message,
                stack: error.stack,
                details: error, // Capture additional details if the error is a custom object.
            });
        }
    }
    async add_option(vote_option, index) {
        try {
            this.logger?.info(`added option: ${vote_option}`);
            const txData = await this.deployedContract.callTx.add_option(vote_option, index);
            this.logger?.trace({
                transactionAdded: {
                    circuit: 'add_option',
                    txHash: txData.public.txHash,
                    blockHeight: txData.public.blockHeight,
                },
            });
        }
        catch (error) {
            console.log('eeeeeeeeeeeeeeee');
            console.log(error.message);
            console.log(error.stack);
            console.log(error);
            // Log the full exception, including stack trace if available.
            this.logger?.error('Error casting a vote', {
                message: error.message,
                stack: error.stack,
                details: error, // Capture additional details if the error is a custom object.
            });
        }
    }
    /**
     * Attempts to caste a vote .
     *
     * @param encrypted_vote The vote to be casted.
     *
     * @remarks
     * This method can fail during local circuit execution if the voting is not open or the user has already voted.
     */
    async cast_vote(encrypted_vote) {
        try {
            this.logger?.info(`casted votee: ${encrypted_vote}`);
            const txData = await this.deployedContract.callTx.cast_vote(encrypted_vote);
            this.logger?.trace({
                transactionAdded: {
                    circuit: 'cast_vote',
                    txHash: txData.public.txHash,
                    blockHeight: txData.public.blockHeight,
                },
            });
        }
        catch (error) {
            let err = error;
            // console.log((error as Error).message);
            // console.log((error as Error).stack);
            // console.log(error);
            if (err.message.includes('type error')) {
                this.logger?.info('You are not authorized to vote! 2');
            }
            else {
                console.log(error.message);
                console.log(error.stack);
                console.log(error);
                // Log the full exception, including stack trace if available.
                this.logger?.error('Error casting a vote', {
                    message: error.message,
                    stack: error.stack,
                    details: error, // Capture additional details if the error is a custom object.
                });
            }
        }
    }
    /**
     * Attempts to caste a vote .
     *
     * @param encrypted_vote The vote to be casted.
     *
     * @remarks
     * This method can fail during local circuit execution if the voting is not open.
     */
    async close_voting() {
        this.logger?.info('close voting...');
        console.log('here');
        const txData = await this.deployedContract.callTx.close_voting();
        this.logger?.trace({
            transactionAdded: {
                circuit: 'close_voting',
                txHash: txData.public.txHash,
                blockHeight: txData.public.blockHeight,
            },
        });
    }
    async open_voting() {
        this.logger?.info('open voting...');
        console.log('here');
        const txData = await this.deployedContract.callTx.open_voting();
        this.logger?.trace({
            transactionAdded: {
                circuit: 'open_voting',
                txHash: txData.public.txHash,
                blockHeight: txData.public.blockHeight,
            },
        });
    }
    async create_voting(vote_question) {
        try {
            this.logger?.info(`vote question: ${vote_question}`);
            const txData = await this.deployedContract.callTx.create_voting(vote_question);
            this.logger?.trace({
                transactionAdded: {
                    circuit: 'create_voting',
                    txHash: txData.public.txHash,
                    blockHeight: txData.public.blockHeight,
                },
            });
        }
        catch (error) {
            console.log('bbbbbbbbbbbbbbbbbbbbbbbbb');
            console.log(error.message);
            console.log(error.stack);
            console.log(error);
            // Log the full exception, including stack trace if available.
            this.logger?.error('Error casting a vote', {
                message: error.message,
                stack: error.stack,
                details: error, // Capture additional details if the error is a custom object.
            });
        }
    }
    /**
     * Attempts to  count all the votes.
     *
     * @remarks
     * This method can fail during local circuit execution if the voting has not yet closed.
     */
    // async count_votes(): Promise<void> {
    //   this.logger?.info('counting votes');
    //   const txData = await this.deployedContract.callTx.count_votes();
    //   this.logger?.trace({
    //     transactionAdded: {
    //       circuit: 'count_votes',
    //       txHash: txData.public.txHash,
    //       blockHeight: txData.public.blockHeight,
    //     },
    //   });
    // }
    /**
     * Deploys a new VoteGuardian contract to the network.
     *
     * @param providers The bulletin board providers.
     * @param logger An optional 'pino' logger to use for logging.
     * @returns A `Promise` that resolves with a {@link VoteGuardianAPI} instance that manages the newly deployed
     * {@link DeployedVoteGuardianContract}; or rejects with a deployment error.
     */
    // ο τύπος VoteGuardianProviders έρχεται από το common-types
    static async deploy(providers, secretKey, logger) {
        try {
            logger?.info('deployContract');
            /* η συνάρτηση deployContract έρχεται από τη βιβλιοθήκη. Πα΄ίρνει ως παράμετρο ένα αντικείμενο τύπου MidnightProviders και ένα αντικείμενο που είναι το
            DeployContractOptions
            */
            const DeployedVoteGuardianContract = await deployContract(providers, {
                privateStateId: 'voteGuardianPrivateState',
                contract: VoteGuardianContractInstance,
                initialPrivateState: createVoteGuardianPrivateState(utils.hexToBytes(secretKey) /*utils.randomBytes(32)*/, {
                    leaf: new Uint8Array(32),
                    path: [
                        {
                            sibling: { field: BigInt(0) },
                            goes_left: false,
                        },
                    ],
                }),
                // initialPrivateState: createVoteGuardianPrivateState(utils.hexToBytes(secretKey)),
            });
            logger?.info('Passed deploy contract');
            logger?.trace({
                contractDeployed: {
                    finalizedDeployTxData: DeployedVoteGuardianContract.deployTxData.public,
                },
            });
            return new VoteGuardianAPI(DeployedVoteGuardianContract, providers, logger);
        }
        catch (error) {
            console.log('Deployed Contract Error');
            console.log(error.message);
            console.log(error.stack);
            console.log(error);
            // Log the full exception, including stack trace if available.
            logger?.error('Error deploying VoteGuardian contract', {
                message: error.message,
                stack: error.stack,
                details: error, // Capture additional details if the error is a custom object.
            });
            return null;
        }
    }
    /**
     * Finds an already deployed bulletin board contract on the network, and joins it.
     *
     * @param providers The bulletin board providers.
     * @param contractAddress The contract address of the deployed bulletin board contract to search for and join.
     * @param logger An optional 'pino' logger to use for logging.
     * @returns A `Promise` that resolves with a {@link VoteGuardianAPI} instance that manages the joined
     * {@link DeployedVoteGuardianContract}; or rejects with an error.
     */
    static async join(providers, contractAddress, secretKey, logger) {
        logger?.info({
            joinContract: {
                contractAddress,
            },
        });
        const deployedVoteGuardianContract = await findDeployedContract(providers, {
            contractAddress,
            contract: VoteGuardianContractInstance,
            privateStateId: 'voteGuardianPrivateState',
            // initialPrivateState: createVoteGuardianPrivateState(utils.randomBytes(32)),
            // initialPrivateState: createVoteGuardianPrivateState(utils.hexToBytes(secretKey)),
            initialPrivateState: 
            // (await providers.privateStateProvider.get('voteGuardianPrivateState')) ??
            createVoteGuardianPrivateState(utils.hexToBytes(secretKey), {
                leaf: new Uint8Array(32),
                path: [
                    {
                        sibling: { field: BigInt(0) },
                        goes_left: false,
                    },
                ],
            }),
        });
        logger?.trace({
            contractJoined: {
                finalizedDeployTxData: deployedVoteGuardianContract.deployTxData.public,
            },
        });
        return new VoteGuardianAPI(deployedVoteGuardianContract, providers, logger);
    }
}
/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';
export * from './common-types.js';
//# sourceMappingURL=index.js.map