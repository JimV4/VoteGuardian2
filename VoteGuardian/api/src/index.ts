/**
 * Provides types and utilities for working with VoteGuardian contracts.
 *
 * @packageDocumentation
 */

// αυτό το αρχείο περιέχει την κύρια λογική του VoteGuardian dapp

import { type ContractAddress, convert_bigint_to_Uint8Array } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import { type Signature } from '@midnight-ntwrk/university-contract';
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
  createVoteGuardianPrivateState2,
  ledger,
  pureCircuits,
  witnesses,
  VOTE_STATE,
} from '@midnight-ntwrk/vote-guardian-contract';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable, Subject, retry, concat, defer } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types/dist/private-state-provider';
import type { SignedCredentialSubject } from '@midnight-ntwrk/university-contract';

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

  // add_voter: (voter_public_key: Uint8Array) => Promise<void>;
  cast_vote: (encrypted_vote: string, signedCredentialsSubject?: SignedCredentialSubject) => Promise<void>;
  close_voting: () => Promise<void>;
  create_voting: (vote_question: string) => Promise<void>;
  add_option: (vote_option: string, index: string) => Promise<void>;
  // verify_identity: (msg: Uint8Array, signature: Signature) => Promise<void>;
  // count_votes: () => Promise<void>;
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
    public readonly providers: VoteGuardianProviders,
    private readonly logger?: Logger,
  ) {
    // const combine = (acc: VoteGuardianDerivedState, value: VoteGuardianDerivedState): VoteGuardianDerivedState => {
    //   return {
    //     voteState: (() => {
    //       switch (value.voteState) {
    //         case VOTE_STATE.open:
    //           return 'open';
    //         case VOTE_STATE.closed:
    //           return 'closed';
    //       }
    //     })(),
    //     votesList: value.votesList,
    //     voteCount: value.voteCount,
    //     voteQuestion: value.voteQuestion,
    //   };
    // };

    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.privateStates$ = new Subject<VoteGuardianPrivateState>();
    this.state$ = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, { type: 'all' })
          .pipe(map((contractState) => ledger(contractState.data))),
        concat(
          from(
            defer(
              () => providers.privateStateProvider.get('voteGuardianPrivateState') as Promise<VoteGuardianPrivateState>,
            ),
          ),
          this.privateStates$,
        ),
      ],
      (ledgerState, privateState) => {
        const result: VoteGuardianDerivedState = {
          voteState: (() => {
            switch (ledgerState.voteState) {
              case VOTE_STATE.open:
                return VOTE_STATE.open;
              case VOTE_STATE.closed:
                return VOTE_STATE.closed;
            }
          })(),
          votesList: ledgerState.votesList,
          voteCount: ledgerState.voteCount,
          voteQuestion: ledgerState.voteQuestion,
        };
        return result;
      },
    );
    // this.state$ = combineLatest(
    //   [
    //     // Combine public (ledger) state with...
    //     providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
    //       map((contractState) => ledger(contractState.data)),
    //       tap((ledgerState) =>
    //         logger?.trace({
    //           ledgerStateChanged: {
    //             ledgerState: {
    //               ...ledgerState,
    //               // state: ledgerState.state === STATE.occupied ? 'occupied' : 'vacant',
    //               voteState: () => {
    //                 if (ledgerState.voteState === VOTE_STATE.open) {
    //                   return 'open';
    //                 } else if (ledgerState.voteState === VOTE_STATE.closed) {
    //                   return 'closed';
    //                 }
    //               },
    //               // votersMap: ledgerState.votersMap,
    //               // votesList: ledgerState.votesList,
    //               // voteCountForEachOption: ledgerState.voteCountForEachOption,
    //               // voteCount: ledgerState.voteCount,
    //               // poster: toHex(ledgerState.poster),
    //             },
    //           },
    //         }),
    //       ),
    //     ),
    //     // ...private state...
    //     //    since the private state of the bulletin board application never changes, we can query the
    //     //    private state once and always use the same value with `combineLatest`. In applications
    //     //    where the private state is expected to change, we would need to make this an `Observable`.
    //     from(providers.privateStateProvider.get('voteGuardianPrivateState') as Promise<VoteGuardianPrivateState>),
    //   ],
    //   // ...and combine them to produce the required derived state.
    //   (ledgerState, privateState) => {
    //     const hashedSecretKey = pureCircuits.public_key(privateState.secretKey);

    //     return {
    //       voteState: ledgerState.voteState,
    //       // votersMap: ledgerState.votersMap,
    //       eligibleVoters: ledgerState.eligibleVoters,
    //       votesList: ledgerState.votesList,
    //       voteCount: ledgerState.voteCount,
    //       voteQuestion: ledgerState.voteQuestion,
    //       isOrganizer: toHex(ledgerState.votingOrganizer) === toHex(hashedSecretKey),
    //     };
    //   },
    // );
  }

  /**
   * Gets the address of the current deployed contract.
   */
  readonly deployedContractAddress: ContractAddress;

  readonly privateStates$: Subject<VoteGuardianPrivateState>;

  /**
   * Gets an observable stream of state changes based on the current public (ledger),
   * and private state data.
   */
  readonly state$: Observable<VoteGuardianDerivedState>;

  /**
   * Attempts to add a voter .
   *
   * @param encrypted_vote The voter's key to be added.
   *
   * @remarks
   * This method can fail during local circuit execution if the voting is not open.
   */
  // static async getOrCreateInitialPrivateState(
  //   privateStateProvider: PrivateStateProvider<VoteGuardianPrivateState>,
  // ): Promise<VoteGuardianPrivateState> {
  //   let state = await privateStateProvider.get('initial');
  //   if (state === null) {
  //     state = createVoteGuardianPrivateState();
  //     await privateStateProvider.set('initial', state);
  //   }
  //   return state;
  // }

  // async add_voter(voter_public_key: Uint8Array): Promise<void> {
  //   try {
  //     this.logger?.info('adding voter');

  //     const txData = await this.deployedContract.callTx.add_voter(voter_public_key);

  //     this.logger?.trace({
  //       transactionAdded: {
  //         circuit: 'add_voter',
  //         txHash: txData.public.txHash,
  //         blockHeight: txData.public.blockHeight,
  //       },
  //     });
  //   } catch (error) {
  //     console.log('asdasdasad');
  //     console.log((error as Error).message);
  //     console.log((error as Error).stack);
  //     console.log(error);
  //     // Log the full exception, including stack trace if available.
  //     this.logger?.error('Error adding voter...', {
  //       message: (error as Error).message,
  //       stack: (error as Error).stack,
  //       details: error, // Capture additional details if the error is a custom object.
  //     });
  //   }
  // }

  async add_option(vote_option: string, index: string): Promise<void> {
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
    } catch (error) {
      console.log('eeeeeeeeeeeeeeee');
      console.log((error as Error).message);
      console.log((error as Error).stack);
      console.log(error);
      // Log the full exception, including stack trace if available.
      this.logger?.error('Error casting a vote', {
        message: (error as Error).message,
        stack: (error as Error).stack,
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

  async cast_vote(encrypted_vote: string, signedCredentialSubject?: SignedCredentialSubject): Promise<void> {
    try {
      this.logger?.info(`casted votee: ${encrypted_vote}`);

      // const initialState = await VoteGuardianAPI.getOrCreateInitialPrivateState(this.providers.privateStateProvider);
      const newState: VoteGuardianPrivateState = {
        signedCredentialSubject,
      };
      await this.providers.privateStateProvider.set('voteGuardianPrivateState', newState);
      this.privateStates$.next(newState);

      const txData = await this.deployedContract.callTx.cast_vote(encrypted_vote);

      this.logger?.trace({
        transactionAdded: {
          circuit: 'cast_vote',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
    } catch (error) {
      let err = error as Error;
      // console.log((error as Error).message);
      // console.log((error as Error).stack);
      // console.log(error);
      if (err.message.includes('type error')) {
        this.logger?.info('You are not authorized to vote! 2');
      } else {
        console.log((error as Error).message);
        console.log((error as Error).stack);
        console.log(error);
        // Log the full exception, including stack trace if available.
        this.logger?.error('Error casting a vote', {
          message: (error as Error).message,
          stack: (error as Error).stack,
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

  async close_voting(): Promise<void> {
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

  async create_voting(vote_question: string): Promise<void> {
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
    } catch (error) {
      console.log('bbbbbbbbbbbbbbbbbbbbbbbbb');
      console.log((error as Error).message);
      console.log((error as Error).stack);
      console.log(error);
      // Log the full exception, including stack trace if available.
      this.logger?.error('Error casting a vote', {
        message: (error as Error).message,
        stack: (error as Error).stack,
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
  static async deploy(providers: VoteGuardianProviders, logger?: Logger): Promise<VoteGuardianAPI | null> {
    try {
      logger?.info('deployContract');

      /* η συνάρτηση deployContract έρχεται από τη βιβλιοθήκη. Πα΄ίρνει ως παράμετρο ένα αντικείμενο τύπου MidnightProviders και ένα αντικείμενο που είναι το
      DeployContractOptions
      */
      let pSignedCredentialSubject: SignedCredentialSubject = {
        hashed_credential: new Uint8Array(32),
        signature: {
          pk: { x: 0n, y: 0n },
          R: { x: 0n, y: 0n },
          s: 0n,
        },
      };
      const DeployedVoteGuardianContract = await deployContract(providers, {
        privateStateKey: 'voteGuardianPrivateState',
        contract: VoteGuardianContractInstance,
        initialPrivateState: { signedCredentialSubject: pSignedCredentialSubject },
        // initialPrivateState: createVoteGuardianPrivateState(),
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
    console.log(`inside api ${secretKey}`);
    let pSignedCredentialSubject: SignedCredentialSubject = {
      hashed_credential: new Uint8Array(32),
      signature: {
        pk: { x: 0n, y: 0n },
        R: { x: 0n, y: 0n },
        s: 0n,
      },
    };
    const deployedVoteGuardianContract = await findDeployedContract(providers, {
      contractAddress,
      contract: VoteGuardianContractInstance,
      privateStateKey: 'voteGuardianPrivateState',
      // initialPrivateState: createVoteGuardianPrivateState(utils.randomBytes(32)),
      // initialPrivateState: createVoteGuardianPrivateState(utils.hexToBytes(secretKey)),
      // initialPrivateState: createVoteGuardianPrivateState(),
      initialPrivateState: { signedCredentialSubject: pSignedCredentialSubject },
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
  //   const existingPrivateState = await providers.privateStateProvider.get('voteGuardianPrivateState');
  //   return existingPrivateState ?? createVoteGuardianPrivateState(utils.randomBytes(32));
  // }
}

/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';

export * from './common-types.js';
