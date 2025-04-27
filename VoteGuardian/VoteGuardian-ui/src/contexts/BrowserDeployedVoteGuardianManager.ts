import {
  type DeployedVoteGuardianAPI,
  VoteGuardianAPI,
  type VoteGuardianProviders,
} from '@midnight-ntwrk/vote-guardian-api';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import {
  BehaviorSubject,
  type Observable,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  of,
  take,
  tap,
  throwError,
  timeout,
  catchError,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import {
  type DAppConnectorAPI,
  type DAppConnectorWalletAPI,
  type ServiceUriConfig,
} from '@midnight-ntwrk/dapp-connector-api';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import {
  type BalancedTransaction,
  type UnbalancedTransaction,
  createBalancedTx,
} from '@midnight-ntwrk/midnight-js-types';
import { type CoinInfo, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import semver from 'semver';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { error } from 'console';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { ledger, type Ledger, type VoteGuardianPrivateState } from '@midnight-ntwrk/vote-guardian-contract';

/**
 * An in-progress bulletin voteGuardian deployment.
 */
export interface InProgressVoteGuardianDeployment {
  readonly status: 'in-progress';
}

/**
 * A deployed bulletin voteGuardian deployment.
 */
export interface DeployedVoteGuardianDeployment {
  readonly status: 'deployed';

  /**
   * The {@link DeployedVoteGuardianAPI} instance when connected to an on network bulletin voteGuardian contract.
   */
  readonly api: DeployedVoteGuardianAPI;
}

/**
 * A failed bulletin voteGuardian deployment.
 */
export interface FailedVoteGuardianDeployment {
  readonly status: 'failed';

  /**
   * The error that caused the deployment to fail.
   */
  readonly error: Error;
}

/**
 * A bulletin voteGuardian deployment.
 */
export type VoteGuardianDeployment =
  | InProgressVoteGuardianDeployment
  | DeployedVoteGuardianDeployment
  | FailedVoteGuardianDeployment;

export const getVoteGuardianLedgerState = (
  providers: VoteGuardianProviders,
  contractAddress: ContractAddress,
): Promise<Ledger | null> =>
  providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? ledger(contractState.data) : null));

/**
 * Provides access to bulletin voteGuardian deployments.
 */
export interface DeployedVoteGuardianAPIProvider {
  /**
   * Gets the observable set of voteGuardian deployments.
   *
   * @remarks
   * This property represents an observable array of {@link VoteGuardianDeployment}, each also an
   * observable. Changes to the array will be emitted as voteGuardians are resolved (deployed or joined),
   * while changes to each underlying voteGuardian can be observed via each item in the array.
   */
  readonly voteGuardianDeployments$: Observable<Array<Observable<VoteGuardianDeployment>>>;

  /**
   * Joins or deploys a bulletin voteGuardian contract.
   *
   * @param contractAddress An optional contract address to use when resolving.
   * @returns An observable voteGuardian deployment.
   *
   * @remarks
   * For a given `contractAddress`, the method will attempt to find and join the identified bulletin voteGuardian
   * contract; otherwise it will attempt to deploy a new one.
   */
  readonly resolve: (contractAddress?: ContractAddress, secretKey?: string) => Observable<VoteGuardianDeployment>;

  /**
   * Retrieves the secret key.
   */
  displaySecretKey: () => Promise<string>;

  getWalletPublicKey: () => Promise<string>;

  displayPublicPaymentMap: (contractAddress: ContractAddress) => Promise<void>;

  setPrivateStateSecretKey: (newSecretKey: string) => Promise<void>;
}

/**
 * A {@link DeployedVoteGuardianAPIProvider} that manages bulletin voteGuardian deployments in a browser setting.
 *
 * @remarks
 * {@link BrowserDeployedVoteGuardianManager} configures and manages a connection to the Midnight Lace
 * wallet, along with a collection of additional providers that work in a web-browser setting.
 */
export class BrowserDeployedVoteGuardianManager implements DeployedVoteGuardianAPIProvider {
  readonly #voteGuardianDeploymentsSubject: BehaviorSubject<Array<BehaviorSubject<VoteGuardianDeployment>>>;
  #initializedProviders: Promise<VoteGuardianProviders> | undefined;

  /**
   * Initializes a new {@link BrowserDeployedVoteGuardianManager} instance.
   *
   * @param logger The `pino` logger to for logging.
   */
  constructor(private readonly logger: Logger) {
    this.#voteGuardianDeploymentsSubject = new BehaviorSubject<Array<BehaviorSubject<VoteGuardianDeployment>>>([]);
    this.voteGuardianDeployments$ = this.#voteGuardianDeploymentsSubject;
  }

  /** @inheritdoc */
  readonly voteGuardianDeployments$: Observable<Array<Observable<VoteGuardianDeployment>>>;

  /** @inheritdoc */
  resolve(contractAddress?: ContractAddress, secretKey?: string): Observable<VoteGuardianDeployment> {
    console.log(secretKey);
    const deployments = this.#voteGuardianDeploymentsSubject.value;
    let deployment = deployments.find(
      (deployment) =>
        deployment.value.status === 'deployed' && deployment.value.api.deployedContractAddress === contractAddress,
    );

    if (deployment) {
      return deployment;
    }

    deployment = new BehaviorSubject<VoteGuardianDeployment>({
      status: 'in-progress',
    });

    if (contractAddress) {
      void this.joinDeployment(deployment, contractAddress, secretKey!);
    } else {
      void this.deployDeployment(deployment);
    }

    this.#voteGuardianDeploymentsSubject.next([...deployments, deployment]);

    return deployment;
  }

  async setPrivateStateSecretKey(newSecretKey: string): Promise<void> {
    const hexToBytes = (hex: string): Uint8Array => {
      if (hex.length % 2 !== 0) {
        throw new Error('Invalid hex string');
      }

      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
      }
      return bytes;
    };
    const providers = await this.getProviders();
    if (providers !== undefined) {
      const existingPrivateState = await providers.privateStateProvider.get('voteGuardianPrivateState');
      const newPrivateState: VoteGuardianPrivateState = {
        secretKey: hexToBytes(newSecretKey),
        voterPublicKeyPath: existingPrivateState!.voterPublicKeyPath,
      };

      if (existingPrivateState) {
        await providers.privateStateProvider.set('voteGuardianPrivateState', newPrivateState);
      }
    }
  }

  async displayPublicPaymentMap(contractAddress: ContractAddress): Promise<void> {
    const providers = await this.getProviders();
    const ledgerState = await getVoteGuardianLedgerState(providers, contractAddress);
    if (providers !== undefined) {
      if (ledgerState == null) {
        console.log('no ledger state');
      } else {
        for (const [key, value] of ledgerState.mapPublicPayment) {
          console.log(`Public Payment Key: ${toHex(key)}. Public Key: ${toHex(value)}.`);
        }
      }
    }
  }

  async getWalletPublicKey(): Promise<string> {
    const providers = await this.getProviders();
    if (providers !== undefined) {
      return providers.walletProvider.coinPublicKey;
    }
    return 'no wallet public key';
  }

  async displaySecretKey(): Promise<string> {
    const providers = await this.getProviders();
    if (providers !== undefined) {
      const existingPrivateState = await providers.privateStateProvider.get('voteGuardianPrivateState');

      if (existingPrivateState) {
        const secretKey = existingPrivateState.secretKey;

        if (secretKey) {
          return toHex(secretKey);
        }
        return 'no secret key';
      }
    }
    return 'no secret key';
  }

  private getProviders(): Promise<VoteGuardianProviders> {
    // We use a cached `Promise` to hold the providers. This will:
    //
    // 1. Cache and re-use the providers (including the configured connector API), and
    // 2. Act as a synchronization point if multiple contract deploys or joins run concurrently.
    //    Concurrent calls to `getProviders()` will receive, and ultimately await, the same
    //    `Promise`.
    return this.#initializedProviders ?? (this.#initializedProviders = initializeProviders(this.logger));
  }

  private async deployDeployment(deployment: BehaviorSubject<VoteGuardianDeployment>): Promise<void> {
    try {
      console.log('here2');
      const providers = await this.getProviders();
      const api = await VoteGuardianAPI.deploy(providers, this.logger);
      if (api == null) {
        throw new Error();
      } else {
        deployment.next({
          status: 'deployed',
          api,
        });
      }
    } catch (error: unknown) {
      console.error('Deployment failed:', error);
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private async joinDeployment(
    deployment: BehaviorSubject<VoteGuardianDeployment>,
    contractAddress: ContractAddress,
    secretKey: string,
  ): Promise<void> {
    try {
      console.log(secretKey);
      const providers = await this.getProviders();
      const api = await VoteGuardianAPI.join(providers, contractAddress, secretKey, this.logger);

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

/** @internal */
const initializeProviders = async (logger: Logger): Promise<VoteGuardianProviders> => {
  const { wallet, uris } = await connectToWallet(logger);
  const walletState = await wallet.state();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'voteGuardian-private-state',
    }),
    zkConfigProvider: new FetchZkConfigProvider(window.location.origin, fetch.bind(window)),
    proofProvider: httpClientProofProvider(uris.proverServerUri),
    publicDataProvider: indexerPublicDataProvider(uris.indexerUri, uris.indexerWsUri),
    walletProvider: {
      coinPublicKey: walletState.coinPublicKey,
      balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
        return wallet
          .balanceTransaction(
            ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
            newCoins,
          )
          .then((tx) => wallet.proveTransaction(tx))
          .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
          .then(createBalancedTx);
      },
    },
    midnightProvider: {
      submitTx(tx: BalancedTransaction): Promise<TransactionId> {
        return wallet.submitTransaction(tx);
      },
    },
  };
};

/** @internal */
const connectToWallet = (logger: Logger): Promise<{ wallet: DAppConnectorWalletAPI; uris: ServiceUriConfig }> => {
  const COMPATIBLE_CONNECTOR_API_VERSION = '1.x';

  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => window.midnight?.mnLace),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Check for wallet connector API');
      }),
      filter((connectorAPI): connectorAPI is DAppConnectorAPI => !!connectorAPI),
      concatMap((connectorAPI) =>
        semver.satisfies(connectorAPI.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION)
          ? of(connectorAPI)
          : throwError(() => {
              logger.error(
                {
                  expected: COMPATIBLE_CONNECTOR_API_VERSION,
                  actual: connectorAPI.apiVersion,
                },
                'Incompatible version of wallet connector API',
              );

              return new Error(
                `Incompatible version of Midnight Lace wallet found. Require '${COMPATIBLE_CONNECTOR_API_VERSION}', got '${connectorAPI.apiVersion}'.`,
              );
            }),
      ),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Compatible wallet connector API found. Connecting.');
      }),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');

            return new Error('Could not find Midnight Lace wallet. Extension installed?');
          }),
      }),
      concatMap(async (connectorAPI) => {
        const isEnabled = await connectorAPI.isEnabled();

        logger.info(isEnabled, 'Wallet connector API enabled status');

        return connectorAPI;
      }),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            logger.error('Wallet connector API has failed to respond');

            return new Error('Midnight Lace wallet has failed to respond. Extension enabled?');
          }),
      }),
      concatMap(async (connectorAPI) => ({ walletConnectorAPI: await connectorAPI.enable(), connectorAPI })),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              logger.error('Unable to enable connector API');
              return new Error('Application is not authorized');
            })
          : apis,
      ),
      concatMap(async ({ walletConnectorAPI, connectorAPI }) => {
        const uris = await connectorAPI.serviceUriConfig();

        logger.info('Connected to wallet connector API and retrieved service configuration');

        return { wallet: walletConnectorAPI, uris };
      }),
    ),
  );
};
