/**
 * Provides types and utilities for working with VoteGuardian contracts.
 *
 * @packageDocumentation
 */

// αυτό το αρχείο περιέχει την κύρια λογική του VoteGuardian dapp

import { type ContractAddress, convert_bigint_to_Uint8Array, MerkleTreePath } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import type {
  VoteGuardianDerivedState,
  VoteGuardianContract,
  VoteGuardianProviders,
  DeployedVoteGuardianContract,
} from './common-types.js';
import {
  type VoteGuardianPrivateState,
  Contract,
  createVoteGuardianPrivateState,
  ledger,
  pureCircuits,
  witnesses,
  VOTE_STATE,
} from '@midnight-ntwrk/vote-guardian-contract';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { Voting } from './Voting.js';

/** @internal */
// ο τύπος Contract έρχεται από το αρχείο index.d.cts. Το witnesses έρχεται από το αρχείο witnesses.ts
const VoteGuardianContractInstance: VoteGuardianContract = new Contract(witnesses);

/**
 * An API for a deployed VoteGuardian.
 */
/* interface για ένα deployed VoteGuardian. Ο τύπος ContractAddress έρχεται από τη βιβλιοθήκη. Ο τύπος VoteGuardianDerivedState 
έρχεται από το common-types. Περιέχει επίσης 2 μεθόδους, έναν για post μηνύματος και ένα για αφαίρεση μηνύματος από το 
bulletin board.
*/
export interface DeployedVoteGuardianAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<VoteGuardianDerivedState>;

  // cast_vote: (voting_id: Uint8Array) => Promise<void>;
  close_voting: (voting_id: Uint8Array) => Promise<void>;
  open_voting: (voting_id: Uint8Array) => Promise<void>;
  edit_question: (voting_id: Uint8Array, vote_question: string) => Promise<void>;
  create_voting: () => Promise<void>;
  add_option: (voting_id: Uint8Array, vote_option: Uint8Array) => Promise<void>;
  publish_vote: (voting_id: Uint8Array) => Promise<void>;
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
// TODO: Update VoteGuardianAPI to use contract level private state storage.
export class VoteGuardianAPI implements DeployedVoteGuardianAPI {
  /** @internal */
  private constructor(
    // θυμίζω ΄ότι το DeployedVoteGuardianContract είναι alias gia FoundContract
    public readonly deployedContract: DeployedVoteGuardianContract,
    providers: VoteGuardianProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.state$ = combineLatest(
      [
        // Combine public (ledger) state with...
        providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
          map((contractState) => ledger(contractState.data)),
          tap((ledgerState) =>
            logger?.trace({
              ledgerStateChanged: {
                ledgerState: {
                  ...ledgerState,
                  // // state: ledgerState.state === STATE.occupied ? 'occupied' : 'vacant',
                  // voteState: () => {
                  //   if (ledgerState.voteState === VOTE_STATE.open) {
                  //     return 'open';
                  //   } else if (ledgerState.voteState === VOTE_STATE.closed) {
                  //     return 'closed';
                  //   }
                  // },
                  // votersMap: ledgerState.votersMap,
                  // votesList: ledgerState.votesList,
                  // voteCountForEachOption: ledgerState.voteCountForEachOption,
                  // voteCount: ledgerState.voteCount,
                  // poster: toHex(ledgerState.poster),
                },
              },
            }),
          ),
        ),
        // ...private state...
        //    since the private state of the bulletin board application never changes, we can query the
        //    private state once and always use the same value with `combineLatest`. In applications
        //    where the private state is expected to change, we would need to make this an `Observable`.
        from(providers.privateStateProvider.get('voteGuardianPrivateState2') as Promise<VoteGuardianPrivateState>),
      ],
      // ...and combine them to produce the required derived state.
      (ledgerState, privateState) => {
        return {
          votings: ledgerState.votings,
          votingQuestions: ledgerState.voting_questions,
          votingOptions: ledgerState.voting_options,
          votingResults: ledgerState.voting_results,
          votingStates: ledgerState.voting_states,
          votingNulifiers: ledgerState.voting_nulifiers,
          votingOrganizers: ledgerState.voting_organizers,
          eligibleVoters: ledgerState.eligible_voters,
          votingList: [],
          publishVotingNulifiers: ledgerState.publish_voting_nulifiers,
          // hashedVotes: ledgerState.hashed_votes,

          // votingList: (() => {
          //   const list: Voting[] = [];
          //   for (const votingId of ledgerState.votings) {
          //     try {
          //       const votingQuestion = ledgerState.voting_questions.lookup(votingId);
          //       const votingOrganizer = ledgerState.voting_organizers.lookup(votingId);
          //       const votingState = ledgerState.voting_states.lookup(votingId);

          //       // Voting Options
          //       const optionsMap = ledgerState.voting_options.lookup(votingId);

          //       let votingOptions = new Map<string, string>();
          //       for (const [optionId, optionText] of optionsMap) {
          //         votingOptions.set(optionId, optionText);
          //       }

          //       // Voting Results
          //       const resultMap = ledgerState.voting_results.lookup(votingId);

          //       let votingResults = new Map<string, bigint>();
          //       for (const [optionId] of optionsMap) {
          //         if (resultMap.member(optionId)) {
          //           const count = resultMap.lookup(optionId).read();
          //           votingResults.set(optionId, count);
          //         } else {
          //           // Option exists but no votes yet
          //           votingResults.set(optionId, BigInt(0));
          //         }
          //       }
          //       const voting = new Voting(
          //         votingId,
          //         votingOrganizer,
          //         votingQuestion,
          //         votingOptions,
          //         votingResults,
          //         votingState,
          //       );

          //       list.push(voting);
          //     } catch (e) {
          //       console.error('Failed to build Voting instance for ID', votingId, e);
          //     }
          //   }
          //   return list;
          // })(),
        };
      },
    );
  }

  /**
   * Gets the address of the current deployed contract.
   */
  readonly deployedContractAddress: ContractAddress;

  /**
   * Gets an observable stream of state changes based on the current public (ledger),
   * and private state data.
   */
  readonly state$: Observable<VoteGuardianDerivedState>;

  async create_voting(): Promise<void> {
    // try {
    console.log('before create voting inside api');
    const txData = await this.deployedContract.callTx.create_voting();
    console.log('after create voting inside api');

    this.logger?.trace({
      transactionAdded: {
        circuit: 'create_voting',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    // } catch (error) {
    //   console.log('eeeeeeeeeeeeeeee');
    //   console.log((error as Error).message);
    //   console.log((error as Error).stack);
    //   console.log(error);
    //   // Log the full exception, including stack trace if available.
    //   this.logger?.error('Error casting a vote', {
    //     message: (error as Error).message,
    //     stack: (error as Error).stack,
    //     details: error, // Capture additional details if the error is a custom object.
    //   });
    // }
  }

  async add_option(voting_id: Uint8Array, vote_option: Uint8Array): Promise<void> {
    // try {
    this.logger?.info(`added option: ${vote_option}`);
    // this.logger?.info(`added index: ${index}`);
    const txData = await this.deployedContract.callTx.add_option(voting_id, vote_option);

    this.logger?.trace({
      transactionAdded: {
        circuit: 'add_option',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    // } catch (error) {
    //   console.log('eeeeeeeeeeeeeeee');
    //   console.log((error as Error).message);
    //   console.log((error as Error).stack);
    //   console.log(error);
    //   // Log the full exception, including stack trace if available.
    //   this.logger?.error('Error casting a vote', {
    //     message: (error as Error).message,
    //     stack: (error as Error).stack,
    //     details: error, // Capture additional details if the error is a custom object.
    //   });
    // }
  }

  /**
   * Attempts to caste a vote .
   *
   * @param encrypted_vote The vote to be casted.
   *
   * @remarks
   * This method can fail during local circuit execution if the voting is not open or the user has already voted.
   */

  // async cast_vote(voting_id: Uint8Array): Promise<void> {
  //   // try {
  //   // this.logger?.info(`casted votee: ${encrypted_vote}`);
  //   const txData = await this.deployedContract.callTx.cast_vote(voting_id);

  //   this.logger?.trace({
  //     transactionAdded: {
  //       circuit: 'cast_vote',
  //       txHash: txData.public.txHash,
  //       blockHeight: txData.public.blockHeight,
  //     },
  //   });
  // } catch (error) {
  //   let err = error as Error;
  //   // console.log((error as Error).message);
  //   // console.log((error as Error).stack);
  //   // console.log(error);
  //   if (err.message.includes('type error')) {
  //     this.logger?.info('You are not authorized to vote! 2');
  //     this.logger?.info(err);
  //     console.log((error as Error).message);
  //     console.log((error as Error).stack);
  //     console.log(error);
  //   } else {
  //     console.log((error as Error).message);
  //     console.log((error as Error).stack);
  //     console.log(error);
  //     // Log the full exception, including stack trace if available.
  //     this.logger?.error('Error casting a vote', {
  //       message: (error as Error).message,
  //       stack: (error as Error).stack,
  //       details: error, // Capture additional details if the error is a custom object.
  //     });
  //   }
  // }
  // }

  async publish_vote(voting_id: Uint8Array): Promise<void> {
    // try {
    this.logger?.info(`voting id: ${voting_id}`);
    const txData = await this.deployedContract.callTx.publish_vote(voting_id);

    this.logger?.trace({
      transactionAdded: {
        circuit: 'publish_option',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    // } catch (error) {
    //   console.log('eeeeeeeeeeeeeeee');
    //   console.log((error as Error).message);
    //   console.log((error as Error).stack);
    //   console.log(error);
    //   // Log the full exception, including stack trace if available.
    //   this.logger?.error('Error casting a vote', {
    //     message: (error as Error).message,
    //     stack: (error as Error).stack,
    //     details: error, // Capture additional details if the error is a custom object.
    //   });
    // }
  }

  /**
   * Attempts to caste a vote .
   *
   * @param encrypted_vote The vote to be casted.
   *
   * @remarks
   * This method can fail during local circuit execution if the voting is not open.
   */

  async close_voting(voting_id: Uint8Array): Promise<void> {
    this.logger?.info('close voting...');
    console.log('here');

    const txData = await this.deployedContract.callTx.close_voting(voting_id);

    this.logger?.trace({
      transactionAdded: {
        circuit: 'close_voting',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async open_voting(voting_id: Uint8Array): Promise<void> {
    this.logger?.info('open voting...');
    console.log('here');

    const txData = await this.deployedContract.callTx.open_voting(voting_id);

    this.logger?.trace({
      transactionAdded: {
        circuit: 'open_voting',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async edit_question(voting_id: Uint8Array, vote_question: string): Promise<void> {
    // try {
    this.logger?.info(`vote question: ${vote_question}`);
    const txData = await this.deployedContract.callTx.edit_question(voting_id, vote_question);

    this.logger?.trace({
      transactionAdded: {
        circuit: 'edit_question',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
    // } catch (error) {
    //   console.log('bbbbbbbbbbbbbbbbbbbbbbbbb');
    //   console.log((error as Error).message);
    //   console.log((error as Error).stack);
    //   console.log(error);
    //   // Log the full exception, including stack trace if available.
    //   this.logger?.error('Error casting a vote', {
    //     message: (error as Error).message,
    //     stack: (error as Error).stack,
    //     details: error, // Capture additional details if the error is a custom object.
    //   });
    // }
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
  static async deploy(
    providers: VoteGuardianProviders,
    secretKey: string,
    eligibleVoterPublicKeys: Uint8Array[],
    logger?: Logger,
  ): Promise<VoteGuardianAPI | null> {
    try {
      logger?.info('deployContract');

      /* η συνάρτηση deployContract έρχεται από τη βιβλιοθήκη. Πα΄ίρνει ως παράμετρο ένα αντικείμενο τύπου MidnightProviders και ένα αντικείμενο που είναι το
      DeployContractOptions
      */
      const DeployedVoteGuardianContract = await deployContract(providers, {
        privateStateId: 'voteGuardianPrivateState2',
        contract: VoteGuardianContractInstance,
        initialPrivateState: createVoteGuardianPrivateState(
          utils.hexToBytes(secretKey),
          {
            leaf: new Uint8Array(32),
            path: [
              {
                sibling: { field: BigInt(0) },
                goes_left: false,
              },
            ],
          },
          new Map<String, String>(),
        ),
        args: [eligibleVoterPublicKeys],
      });

      logger?.info('Passed deploy contract');

      logger?.trace({
        contractDeployed: {
          finalizedDeployTxData: DeployedVoteGuardianContract.deployTxData.public,
        },
      });

      return new VoteGuardianAPI(DeployedVoteGuardianContract, providers, logger);
    } catch (error) {
      console.log('Deployed Contract Error');
      console.log((error as Error).message);
      console.log((error as Error).stack);
      console.log(error);
      // Log the full exception, including stack trace if available.
      logger?.error('Error deploying VoteGuardian contract', {
        message: (error as Error).message,
        stack: (error as Error).stack,
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
  static async join(
    providers: VoteGuardianProviders,
    contractAddress: ContractAddress,
    secretKey: string,
    logger?: Logger,
  ): Promise<VoteGuardianAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const privateStateMerklePath = await this.getPrivateStateMerklePath(providers);
    const privateStateVotersMap = await this.getPrivateStateVotesMap(providers);
    const deployedVoteGuardianContract = await findDeployedContract(providers, {
      contractAddress,
      contract: VoteGuardianContractInstance,
      privateStateId: 'voteGuardianPrivateState2',
      // initialPrivateState: createVoteGuardianPrivateState(utils.randomBytes(32)),
      // initialPrivateState: createVoteGuardianPrivateState(utils.hexToBytes(secretKey)),
      initialPrivateState:
        // (await providers.privateStateProvider.get('voteGuardianPrivateState2')) ??
        createVoteGuardianPrivateState(utils.hexToBytes(secretKey), privateStateMerklePath, privateStateVotersMap),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedVoteGuardianContract.deployTxData.public,
      },
    });

    return new VoteGuardianAPI(deployedVoteGuardianContract, providers, logger);
  }

  // ο τύπος VoteGuardianProviders έρχεται από το common-types.ts και ο τύπος VoteGuardianPrivateState έρχεται από το witnesses.ts
  // private static async getPrivateState(providers: VoteGuardianProviders): Promise<VoteGuardianPrivateState> {
  //   const existingPrivateState = await providers.privateStateProvider.get('voteGuardianPrivateState2');
  //   return existingPrivateState ?? createVoteGuardianPrivateState(utils.randomBytes(32));
  // }
  private static async getPrivateStateMerklePath(
    providers: VoteGuardianProviders,
  ): Promise<MerkleTreePath<Uint8Array>> {
    const existingPrivateState = await providers.privateStateProvider.get('voteGuardianPrivateState2');
    return (
      existingPrivateState?.voterPublicKeyPath ?? {
        leaf: new Uint8Array(32),
        path: [
          {
            sibling: { field: BigInt(0) },
            goes_left: false,
          },
        ],
      }
    );
  }

  private static async getPrivateStateVotesMap(providers: VoteGuardianProviders): Promise<Map<String, String>> {
    const existingPrivateState = await providers.privateStateProvider.get('voteGuardianPrivateState2');
    return existingPrivateState?.votesPerVotingMap ?? new Map<String, String>();
  }

  // public static async setPrivateStateVotesMap(providers: VoteGuardianProviders): Promise<void> {
  //   const existingPrivateState = await providers.privateStateProvider.get('voteGuardianPrivateState2');
  //   const updatedVotesPerVotingMap = new Map(existingPrivateState!.votesPerVotingMap);
  //   updatedVotesPerVotingMap.set(votingId, vote);

  //   const newPrivateState: VoteGuardianPrivateState = {
  //     secretKey: existingPrivateState!.secretKey,
  //     voterPublicKeyPath: existingPrivateState!.voterPublicKeyPath,
  //     votesPerVotingMap: updatedVotesPerVotingMap,
  //   };

  //   if (existingPrivateState) {
  //     await providers.privateStateProvider.set('voteGuardianPrivateState2', newPrivateState);
  //   }
  // }
}

/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';

export * from './common-types.js';
