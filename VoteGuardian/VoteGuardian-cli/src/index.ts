// /*
//  * This file is the main driver for the Midnight bulletin board example.
//  * The entry point is the run function, at the end of the file.
//  * We expect the startup files (testnet-remote.ts, standalone.ts, etc.) to
//  * call run with some specific configuration that sets the network addresses
//  * of the servers this file relies on.
//  */

import { createInterface, type Interface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { WebSocket } from 'ws';
import { webcrypto } from 'crypto';
import {
  type VoteGuardianProviders,
  type PrivateStates,
  VoteGuardianAPI,
  utils,
  type VoteGuardianDerivedState,
  type DeployedVoteGuardianContract,
} from '@midnight-ntwrk/vote-guardian-api';
import { ledger, type Ledger, VOTE_STATE } from '@midnight-ntwrk/vote-guardian-contract';
import {
  type BalancedTransaction,
  createBalancedTx,
  type MidnightProvider,
  type UnbalancedTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import * as Rx from 'rxjs';
import { type CoinInfo, nativeToken, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { type Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { type Logger } from 'pino';
import { type Config, StandaloneConfig } from './config.js';
import type { StartedDockerComposeEnvironment, DockerComposeEnvironment } from 'testcontainers';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import axios from 'axios';

// @ts-expect-error: It's needed to make Scala.js and WASM code able to use cryptography
globalThis.crypto = webcrypto;

// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

/* **********************************************************************
 * createWalletAndMidnightProvider: returns an object that
 * satifies both the WalletProvider and MidnightProvider
 * interfaces, both implemented in terms of the given wallet.
 */

const createWalletAndMidnightProvider = async (wallet: Wallet): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(wallet.state());
  return {
    coinPublicKey: state.coinPublicKey,
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
    submitTx(tx: BalancedTransaction): Promise<TransactionId> {
      return wallet.submitTransaction(tx);
    },
  };
};

/* **********************************************************************
 * waitForFunds: wait for tokens to appear in a wallet.
 *
 * This is an interesting example of watching the stream of states
 * coming from the pub-sub indexer.  It watches both
 *  1. how close the state is to present reality and
 *  2. the balance held by the wallet.
 */

const waitForFunds = (wallet: Wallet, logger: Logger) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.tap((state) => {
        const scanned = state.syncProgress?.synced ?? 0n;
        const total = state.syncProgress?.total.toString() ?? 'unknown number';
        logger.info(`Wallet scanned ${scanned} blocks out of ${total}`);
      }),
      Rx.filter((state) => {
        // Let's allow progress only if wallet is close enough
        const synced = state.syncProgress?.synced ?? 0n;
        const total = state.syncProgress?.total ?? 1_000n;
        return total - synced < 100n;
      }),
      Rx.map((s) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance) => balance > 0n),
    ),
  );

/* **********************************************************************
 * buildWalletAndWaitForFunds: the main function that creates a wallet
 * and waits for tokens to appear in it.  The various "buildWallet"
 * functions all arrive here after collecting information for the
 * arguments.
 */

const buildWalletAndWaitForFunds = async (
  { indexer, indexerWS, node, proofServer }: Config,
  logger: Logger,
  seed: string,
): Promise<Wallet & Resource> => {
  const wallet = await WalletBuilder.buildFromSeed(
    indexer,
    indexerWS,
    proofServer,
    node,
    seed,
    getZswapNetworkId(),
    'warn',
  );
  wallet.start();
  const state = await Rx.firstValueFrom(wallet.state());
  logger.info(`Your wallet seed is: ${seed}`);
  logger.info(`Your wallet address is: ${state.address}`);
  let balance = state.balances[nativeToken()];
  if (balance === undefined || balance === 0n) {
    logger.info(`Your wallet balance is: 0`);
    logger.info(`Waiting to receive tokens...`);
    balance = await waitForFunds(wallet, logger);
  }
  logger.info(`Your wallet balance is: ${balance}`);
  return wallet;
};

// Generate a random see and create the wallet with that.
const buildFreshWallet = async (config: Config, logger: Logger): Promise<Wallet & Resource> =>
  await buildWalletAndWaitForFunds(config, logger, toHex(utils.randomBytes(32)));

// Prompt for a seed and create the wallet with that.
const buildWalletFromSeed = async (config: Config, rli: Interface, logger: Logger): Promise<Wallet & Resource> => {
  const seed = await rli.question('Enter your wallet seed: ');
  return await buildWalletAndWaitForFunds(config, logger, seed);
};

/* ***********************************************************************
 * This seed gives access to tokens minted in the genesis block of a local development node - only
 * used in standalone networks to build a wallet with initial funds.
 */
const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000042';

/* **********************************************************************
 * buildWallet: unless running in a standalone (offline) mode,
 * prompt the user to tell us whether to create a new wallet
 * or recreate one from a prior seed.
 */

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const buildWallet = async (config: Config, rli: Interface, logger: Logger): Promise<(Wallet & Resource) | null> => {
  if (config instanceof StandaloneConfig) {
    return await buildWalletAndWaitForFunds(config, logger, GENESIS_MINT_WALLET_SEED);
  }
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case '1':
        return await buildFreshWallet(config, logger);
      case '2':
        return await buildWalletFromSeed(config, rli, logger);
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const mapContainerPort = (env: StartedDockerComposeEnvironment, url: string, containerName: string) => {
  const mappedUrl = new URL(url);
  const container = env.getContainer(containerName);

  mappedUrl.port = String(container.getFirstMappedPort());

  return mappedUrl.toString().replace(/\/+$/, '');
};

/* **********************************************************************
 * run: the main entry point that starts the whole bulletin board CLI.
 *
 * If called with a Docker environment argument, the application
 * will wait for Docker to be ready before doing anything else.
 */

// export const run = async (config: Config, logger: Logger, dockerEnv?: DockerComposeEnvironment): Promise<void> => {};

export const run = async (config: Config, logger: Logger, dockerEnv?: DockerComposeEnvironment): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  let env;
  if (dockerEnv !== undefined) {
    env = await dockerEnv.up();

    if (config instanceof StandaloneConfig) {
      config.indexer = mapContainerPort(env, config.indexer, 'voteguardian-indexer');
      config.indexerWS = mapContainerPort(env, config.indexerWS, 'voteguardian-indexer');
      config.node = mapContainerPort(env, config.node, 'voteguardian-node');
      config.proofServer = mapContainerPort(env, config.proofServer, 'voteguardian-proof-server');
    }
  }
  const wallet = await buildWallet(config, rli, logger);

  if (wallet != null) {
    async function sendNativeToken(address: string, amount: bigint): Promise<string> {
      const transferRecipe = await wallet!.transferTransaction([
        {
          amount,
          receiverAddress: address,
          type: nativeToken(),
        },
      ]);
      const transaction = await wallet!.proveTransaction(transferRecipe);
      return await wallet!.submitTransaction(transaction);
    }

    await sendNativeToken(
      '343257a332f97ed43d53ed2d9e0785bddb767f45b7b398204a95563e5ccb9de9|0300edec82521e7aaf375f28895084f0a79f640ef2a375263450ee900bf8ad02eae17be28743966afc289670101a5c8f50163a7859f79359fb1e',
      10000000000n,
    );
  }
};

// import { WalletBuilder } from '@midnight-ntwrk/wallet';
// import { NetworkId, nativeToken } from '@midnight-ntwrk/zswap';

// try {
//   const wallet = await WalletBuilder.build(
//     'http://localhost:8088/api/v1/graphqll',
//     'http://localhost:8088/api/v1/graphql',
//     'http://localhost:6300',
//     'http://localhost:9944',
//     NetworkId.Undeployed,
//   );

//   wallet.start();

//   const transferRecipe = await wallet.transferTransaction([
//     {
//       amount: 10000n,
//       type: nativeToken(), // tDUST token type
//       receiverAddress:
//         '13a2623c4350c176237a2dc99727209466b74069b343032ca531467980d79eea|030056fe5b029eb186b63ccdb446a405da82cd67b1a95ef6d12da2b8e44ab04c17cf2c4b2e714b45ec4fb6d30f975ed714bcf1396bdb37f70f17|010001f38d17a48161d6248ee10a799dca0799eecbd8f1f20bbeb4eb2645656c104cde',
//     },
//   ]);

//   const provenTransaction = await wallet.proveTransaction(transferRecipe);

//   const submittedTransaction = await wallet.submitTransaction(provenTransaction);

//   console.log('Transaction submitted', submittedTransaction);
// } catch (error) {
//   console.log('An error occurred', error);
// }
