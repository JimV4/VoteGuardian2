// import { type CredentialSubject, pureCircuits, type Signature } from '@midnight-ntwrk/university-contract';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { randomBytes as nodeRandomBytes } from 'crypto';
import { Request, Response } from 'express';

// Import dependencies
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import cors from 'cors';
import type { VoteGuardianPrivateState } from '@midnight-ntwrk/vote-guardian-contract';
import { encodeCoinPublicKey } from '@midnight-ntwrk/ledger';

/*
 * This file is the main driver for the Midnight bulletin board example.
 * The entry point is the run function, at the end of the file.
 * We expect the startup files (testnet-remote.ts, standalone.ts, etc.) to
 * call run with some specific configuration that sets the network addresses
 * of the servers this file relies on.
 */

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
  MidnightProviders,
  PrivateStateProvider,
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
import { P, type Logger } from 'pino';
// import { type Config, StandaloneConfig } from '../config.js';
import type { StartedDockerComposeEnvironment, DockerComposeEnvironment } from 'testcontainers';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { SigningKey, type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import path from 'node:path';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { inMemoryPrivateStateProvider } from '@midnight-ntwrk/vote-guardian-api';
import * as fsAsync from 'node:fs/promises';
import pinoPretty from 'pino-pretty';
import pino from 'pino';
import { createWriteStream } from 'node:fs';
import * as fs from 'node:fs';
import dotenv from 'dotenv';

const hexToBytes = (hex: string) => {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};
dotenv.config();
export function stringToUint8Array(input: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(input);
}

export const createLogger = async (logPath: string): Promise<pino.Logger> => {
  await fsAsync.mkdir(path.dirname(logPath), { recursive: true });
  const pretty: pinoPretty.PrettyStream = pinoPretty({
    colorize: true,
    sync: true,
  });
  const level =
    process.env.DEBUG_LEVEL !== undefined && process.env.DEBUG_LEVEL !== null && process.env.DEBUG_LEVEL !== ''
      ? process.env.DEBUG_LEVEL
      : 'info';
  return pino(
    {
      level,
      depthLimit: 20,
    },
    pino.multistream([
      { stream: pretty, level },
      { stream: createWriteStream(logPath), level },
    ]),
  );
};

//// @ts-expect-error: It's needed to make Scala.js and WASM code able to use cryptography
// globalThis.crypto = webcrypto;
let logger: Logger;

// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;
export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

let secretKeyFromDh: string;

export interface Config {
  readonly privateStateStoreName: string;
  readonly logDir: string;
  readonly zkConfigPath: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;

  setNetworkId: () => void;
}

export class StandaloneConfig implements Config {
  privateStateStoreName = 'voteGuardian-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'dist', 'managed', 'vote-guardian');
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';

  setNetworkId() {
    setNetworkId(NetworkId.Undeployed);
  }
}

export class TestnetRemoteConfig implements Config {
  privateStateStoreName = 'vote-guardian-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'testnet-remote', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'dist', 'managed', 'vote-guardian');
  indexer = 'https://indexer-rs.testnet-02.midnight.network/api/v1/graphql';
  //   indexer = 'https://indexer-rs.testnet-02.midnight.network/api/v1/graphql';
  // indexerWS = 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws';
  indexerWS = 'wss://indexer-rs.testnet-02.midnight.network/api/v1/graphql/ws';
  node = 'https://rpc.testnet-02.midnight.network';
  // proofServer = 'http://127.0.0.1:6300';
  // proofServer = 'https://brick-towers-proof-server.testnet.midnight.solutions';
  proofServer = 'http://127.0.0.1:6300';

  setNetworkId() {
    setNetworkId(NetworkId.TestNet);
  }
}

// export const inMemoryPrivateStateProvider = <PSS extends PrivateStateSchema>(): PrivateStateProvider<PSS> => {
//   const record: PSS = {} as PSS;
//   const signingKeys = {} as Record<ContractAddress, SigningKey>;
//   return {
//     set<PSK extends PrivateStateKey<PSS>>(key: PSK, state: PSS[PSK]): Promise<void> {
//       record[key] = state;
//       return Promise.resolve();
//     },
//     get<PSK extends PrivateStateKey<PSS>>(key: PSK): Promise<PSS[PSK] | null> {
//       const value = record[key] ?? null;
//       return Promise.resolve(value);
//     },
//     remove<PSK extends PrivateStateKey<PSS>>(key: PSK): Promise<void> {
//       delete record[key];
//       return Promise.resolve();
//     },
//     clear(): Promise<void> {
//       Object.keys(record).forEach((key) => {
//         delete record[key];
//       });
//       return Promise.resolve();
//     },
//     setSigningKey(contractAddress: ContractAddress, signingKey: SigningKey): Promise<void> {
//       signingKeys[contractAddress] = signingKey;
//       return Promise.resolve();
//     },
//     getSigningKey(contractAddress: ContractAddress): Promise<SigningKey | null> {
//       const value = signingKeys[contractAddress] ?? null;
//       return Promise.resolve(value);
//     },
//     removeSigningKey(contractAddress: ContractAddress): Promise<void> {
//       // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//       delete signingKeys[contractAddress];
//       return Promise.resolve();
//     },
//     clearSigningKeys(): Promise<void> {
//       Object.keys(signingKeys).forEach((contractAddress) => {
//         // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//         delete signingKeys[contractAddress];
//       });
//       return Promise.resolve();
//     },
//   };
// };

/* **********************************************************************
 * getVoteGuardianLedgerState: a helper that queries the current state of
 * the data on the ledger, for a specific VoteGuardian contract.
 * Note that the Ledger type returned here is not some generic,
 * abstract ledger object, but specifically the type generated by
 * the Compact compiler to correspond to the ledger declaration
 * in the bulletin board contract.
 */

export const getVoteGuardianLedgerState = (
  providers: VoteGuardianProviders,
  contractAddress: ContractAddress,
): Promise<Ledger | null> =>
  providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? ledger(contractState.data) : null));

function uint8ArrayToString(uint8Array: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(uint8Array);
}

const mainLoop = async (providers: VoteGuardianProviders, rli: Interface, logger: Logger): Promise<void> => {
  const secretKeyBytes = new Uint8Array(32);
  const secretKey = toHex(secretKeyBytes);

  function uint8ArrayToHex(uint8Array: Uint8Array) {
    return Array.from(uint8Array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Generate 5 random 32-byte Uint8Arrays
  const initialRandomValues = Array.from({ length: 5 }, () => {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return arr;
  });

  // Hash function using Web Crypto
  async function sha256(input: Uint8Array) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', input);
    return new Uint8Array(hashBuffer);
  }

  let eligibleVoters = [];

  // for (const randomValue of initialRandomValues) {
  //   const hash = await sha256(randomValue);
  //   eligibleVoters.push(hash);
  // }
  const users = await User.find({}).select('publicKey -_id');

  eligibleVoters = users.map((user) => user.publicKey);
  // console.log('Initial random values (hex):');
  // console.log(initialRandomValues.map(uint8ArrayToHex));

  console.log('\nSHA-256 hashes (hex):');
  console.log(eligibleVoters);
  const eligibleVotersUint8: Uint8Array[] = eligibleVoters.map((voterStr) => {
    return hexToBytes(voterStr!);
  });

  const contractAddressFile = path.resolve(process.cwd(), 'contract_address.txt');
  const contractAddress = fs.readFileSync(contractAddressFile, 'utf8').trim();
  let VoteGuardianApi: VoteGuardianAPI | null;

  if (contractAddress) {
    VoteGuardianApi = await VoteGuardianAPI.join(providers, contractAddress, secretKey, logger);
  } else {
    VoteGuardianApi = await VoteGuardianAPI.deploy(providers, secretKey, eligibleVotersUint8, logger);
  }

  if (VoteGuardianApi === null) {
    return;
  }
  console.log(`deployed - joined at address ${VoteGuardianApi.deployedContractAddress}`);

  fs.writeFileSync(contractAddressFile, VoteGuardianApi.deployedContractAddress, 'utf8');
  console.log('4 at main loop');
  let currentState: VoteGuardianDerivedState | undefined;
  const stateObserver = {
    next: (state: VoteGuardianDerivedState) => (currentState = state),
  };
  const subscription = VoteGuardianApi.state$.subscribe(stateObserver);
};

/* **********************************************************************
 * createWalletAndMidnightProvider: returns an object that
 * satifies both the WalletProvider and MidnightProvider
 * interfaces, both implemented in terms of the given wallet.
 */

export const createWalletAndMidnightProvider = async (wallet: Wallet): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(wallet.state());
  return {
    coinPublicKey: state.coinPublicKey,
    encryptionPublicKey: state.encryptionPublicKey,
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

export const waitForSync = (wallet: Wallet) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`,
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if wallet is synced fully
        return state.syncProgress !== undefined && state.syncProgress.synced;
      }),
    ),
  );

export const waitForSyncProgress = async (wallet: Wallet) =>
  await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`,
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if syncProgress is defined
        return state.syncProgress !== undefined;
      }),
    ),
  );

/* **********************************************************************
 * waitForFunds: wait for tokens to appear in a wallet.
 *
 * This is an interesting example of watching the stream of states
 * coming from the pub-sub indexer.  It watches both
 *  1. how close the state is to present reality and
 *  2. the balance held by the wallet.
 */

// const waitForFunds = (wallet: Wallet, logger: Logger) =>
//   Rx.firstValueFrom(
//     wallet.state().pipe(
//       Rx.throttleTime(10_000),
//       Rx.tap((state) => {
//         const scanned = state.syncProgress?.synced ?? 0n;
//         const total = state.syncProgress?.toString() ?? 'unknown number';
//         logger.info(`Wallet scanned ${scanned} blocks out of ${total}`);
//       }),
//       // Rx.filter((state) => {
//       //   // Let's allow progress only if wallet is close enough
//       //   const synced = state.syncProgress?.synced ?? 0n;
//       //   const total = state.syncProgress?.total ?? 1_000n;
//       //   return total - synced < 100n;
//       // }),
//       Rx.map((s) => s.balances[nativeToken()] ?? 0n),
//       Rx.filter((balance) => balance > 0n),
//     ),
//   );
export const waitForFunds = (wallet: Wallet) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`,
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if wallet is synced
        return state.syncProgress?.synced === true;
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

export const buildWalletAndWaitForFunds = async (
  { indexer, indexerWS, node, proofServer }: Config,
  seed: string,
  filename: string,
): Promise<Wallet & Resource> => {
  // const directoryPath = process.env.SYNC_CACHE;

  const walletSeedFile = path.resolve(process.cwd(), 'wallet_seed.txt');
  const content = fs.readFileSync(walletSeedFile, 'utf8').trim();

  let wallet: Wallet & Resource;

  if (content) {
    logger.info('Wallet save file found, building wallet from seed');
    seed = content;
    wallet = await WalletBuilder.buildFromSeed(
      indexer,
      indexerWS,
      proofServer,
      node,
      content,
      getZswapNetworkId(),
      'info',
    );
    wallet.start();
    // }
    // if (directoryPath !== undefined) {
    //   if (fs.existsSync(`${directoryPath}/${filename}`)) {
    //     logger.info(`Attempting to restore state from ${directoryPath}/${filename}`);
    //     try {
    //       const serializedStream = fs.createReadStream(`${directoryPath}/${filename}`, 'utf-8');
    //       const serialized = await streamToString(serializedStream);
    //       serializedStream.on('finish', () => {
    //         serializedStream.close();
    //       });
    //       wallet = await WalletBuilder.restore(indexer, indexerWS, proofServer, node, seed, serialized, 'info');
    //       wallet.start();
    //       const stateObject = JSON.parse(serialized);
    //       if ((await isAnotherChain(wallet, Number(stateObject.offset))) === true) {
    //         logger.warn('The chain was reset, building wallet from scratch');
    //         wallet = await WalletBuilder.buildFromSeed(
    //           indexer,
    //           indexerWS,
    //           proofServer,
    //           node,
    //           seed,
    //           getZswapNetworkId(),
    //           'info',
    //         );
    //         wallet.start();
    //       } else {
    //         const newState = await waitForSync(wallet);
    //         // allow for situations when there's no new index in the network between runs
    //         if (newState.syncProgress?.synced) {
    //           logger.info('Wallet was able to sync from restored state');
    //         } else {
    //           logger.info(`Offset: ${stateObject.offset}`);
    //           logger.info(`SyncProgress.lag.applyGap: ${newState.syncProgress?.lag.applyGap}`);
    //           logger.info(`SyncProgress.lag.sourceGap: ${newState.syncProgress?.lag.sourceGap}`);
    //           logger.warn('Wallet was not able to sync from restored state, building wallet from scratch');
    //           wallet = await WalletBuilder.buildFromSeed(
    //             indexer,
    //             indexerWS,
    //             proofServer,
    //             node,
    //             seed,
    //             getZswapNetworkId(),
    //             'info',
    //           );
    //           wallet.start();
    //         }
    //       }
    //     } catch (error: unknown) {
    //       if (typeof error === 'string') {
    //         logger.error(error);
    //       } else if (error instanceof Error) {
    //         logger.error(error.message);
    //       } else {
    //         logger.error(error);
    //       }
    //       logger.warn('Wallet was not able to restore using the stored state, building wallet from scratch');
    //       wallet = await WalletBuilder.buildFromSeed(
    //         indexer,
    //         indexerWS,
    //         proofServer,
    //         node,
    //         seed,
    //         getZswapNetworkId(),
    //         'info',
    //       );
    //       wallet.start();
    //     }
  } else {
    logger.info('Wallet save file not found, building wallet from scratch');
    wallet = await WalletBuilder.buildFromSeed(
      indexer,
      indexerWS,
      proofServer,
      node,
      seed,
      getZswapNetworkId(),
      'info',
    );
    wallet.start();
    fs.writeFileSync(walletSeedFile, seed, 'utf8');
  }
  // } else {
  //   logger.info('File path for save file not found, building wallet from scratch');
  //   wallet = await WalletBuilder.buildFromSeed(
  //     indexer,
  //     indexerWS,
  //     proofServer,
  //     node,
  //     seed,
  //     getZswapNetworkId(),
  //     'info',
  //   );
  //   wallet.start();
  // }

  const state = await Rx.firstValueFrom(wallet.state());
  logger.info(`Your wallet seed is: ${seed}`);
  logger.info(`Your wallet address is: ${state.address}`);
  let balance = state.balances[nativeToken()];
  if (balance === undefined || balance === 0n) {
    logger.info(`Your wallet balance is: 0`);
    logger.info(`Waiting to receive tokens...`);
    balance = await waitForFunds(wallet);
  }
  logger.info(`Your wallet balance is: ${balance}`);
  return wallet;
};

// Generate a random see and create the wallet with that.
const buildFreshWallet = async (config: Config): Promise<Wallet & Resource> =>
  await buildWalletAndWaitForFunds(config, toHex(utils.randomBytes(32)), '');

/* ***********************************************************************
 * This seed gives access to tokens minted in the genesis block of a local development node - only
 * used in standalone networks to build a wallet with initial funds.
 */
const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

/* **********************************************************************
 * buildWallet: unless running in a standalone (offline) mode,
 * prompt the user to tell us whether to create a new wallet
 * or recreate one from a prior seed.
 */

const buildWallet = async (config: Config, rli: Interface, logger: Logger): Promise<(Wallet & Resource) | null> => {
  if (config instanceof StandaloneConfig) {
    return await buildWalletAndWaitForFunds(config, GENESIS_MINT_WALLET_SEED, '');
  }

  return await buildFreshWallet(config);
};

const buildWalletFromSeed = async (config: Config, rli: Interface): Promise<Wallet & Resource> => {
  const seed = await rli.question('Enter your wallet seed: ');
  return await buildWalletAndWaitForFunds(config, seed, '');
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

  console.log('2 after wallet');
  try {
    if (wallet !== null) {
      const walletAndMidnightProvider = await createWalletAndMidnightProvider(wallet);
      // εδώ φτιάχνονται οι providers και μετά δίνονται όπου χρειάζονται providers
      const providers = {
        // privateStateProvider: levelPrivateStateProvider<PrivateStates>({
        //   privateStateStoreName: config.privateStateStoreName,
        // }),
        privateStateProvider: inMemoryPrivateStateProvider<'voteGuardianPrivateState', VoteGuardianPrivateState>(),

        // μέσω του publicDataProvider μπορώ να βλέπω το public state του contract
        publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),

        // provider για τα zk proofs. Δίνει το path όπου βρίσκονται τα keys και τα circuits
        zkConfigProvider: new NodeZkConfigProvider<
          'cast_vote' | 'close_voting' | 'create_voting' | 'add_option' | 'open_voting' | 'edit_question'
        >(config.zkConfigPath),
        proofProvider: httpClientProofProvider(config.proofServer),
        walletProvider: walletAndMidnightProvider,
        midnightProvider: walletAndMidnightProvider,
      };
      console.log('3 before main loop');
      await mainLoop(providers, rli, logger);
    }
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Found error '${e.message}'`);
      logger.info('Exiting...');
      1;
      logger.debug(`${e.stack}`);
    } else {
      throw e;
    }
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
    } finally {
      try {
        if (wallet !== null) {
          await wallet.close();
        }
      } catch (e) {
      } finally {
        try {
          if (env !== undefined) {
            await env.down();
            logger.info('Goodbye');
            process.exit(0);
          }
        } catch (e) {}
      }
    }
  }
};

export const streamToString = async (stream: fs.ReadStream): Promise<string> => {
  const chunks: Buffer[] = [];
  return await new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk));
    stream.on('error', (err) => {
      reject(err);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
};

export const isAnotherChain = async (wallet: Wallet, offset: number) => {
  await waitForSyncProgress(wallet);
  // Here wallet does not expose the offset block it is synced to, that is why this workaround
  const walletOffset = Number(JSON.parse(await wallet.serializeState()).offset);
  if (walletOffset < offset - 1) {
    logger.info(`Your offset offset is: ${walletOffset} restored offset: ${offset} so it is another chain`);
    return true;
  } else {
    logger.info(`Your offset offset is: ${walletOffset} restored offset: ${offset} ok`);
    return false;
  }
};

export const saveState = async (wallet: Wallet, filename: string) => {
  const directoryPath = process.env.SYNC_CACHE;
  if (directoryPath !== undefined) {
    logger.info(`Saving state in ${directoryPath}/${filename}`);
    try {
      await fsAsync.mkdir(directoryPath, { recursive: true });
      const serializedState = await wallet.serializeState();
      const writer = fs.createWriteStream(`${directoryPath}/${filename}`);
      writer.write(serializedState);

      writer.on('finish', function () {
        logger.info(`File '${directoryPath}/${filename}' written successfully.`);
      });

      writer.on('error', function (err) {
        logger.error(err);
      });
      writer.end();
    } catch (e) {
      if (typeof e === 'string') {
        logger.warn(e);
      } else if (e instanceof Error) {
        logger.warn(e.message);
      }
    }
  } else {
    logger.info('Not saving cache as sync cache was not defined');
  }
};

// Initialize the app
const app = express();

app.use(express.json());
app.use(cors());

// const hexToBytes = (hex: string) => {
//   if (hex.length % 2 !== 0) {
//     throw new Error('Invalid hex string');
//   }

//   const bytes = new Uint8Array(hex.length / 2);
//   for (let i = 0; i < hex.length; i += 2) {
//     bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
//   }
//   return bytes;
// };

function pad(s: string, n: number): Uint8Array {
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(s);
  if (n < utf8Bytes.length) {
    throw new Error(`The padded length n must be at least ${utf8Bytes.length}`);
  }
  const paddedArray = new Uint8Array(n);
  paddedArray.set(utf8Bytes);
  return paddedArray;
}

// const hashSubject = (subject: CredentialSubject): string => {
//   return toHex(pureCircuits.subject_hash(subject));
// };

// const generateSignature = (subject: CredentialSubject, sk: Uint8Array): Signature => {
//   const msg = Buffer.from(hashSubject(subject), 'hex');
//   return pureCircuits.sign(msg, sk);
// };

// function fromRawSubject(raw: any): CredentialSubject {
//   return {
//     username: pad(raw.username, 32),
//     hashed_secret: new Uint8Array(fromHex(raw.hashed_secret)),
//   };
// }

// Middleware
app.use(bodyParser.json());

// MongoDB connection string (replace with your MongoDB URI)
const mongoURI = 'mongodb://127.0.0.1:27017/voteguardian';

mongoose.connect(mongoURI, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define a User schema and model
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  publicKey: String,
});

const User = mongoose.model('User', userSchema);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Endpoint to insert a new user
app.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: 'Username already exists.' });
    }

    // Create a new user
    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully.', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

const decryptSecret = (encryptedHex: string, ivHex: string, tagHex: string): string => {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
};

app.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password, publicKey } = req.body.subject;

  // 1. Basic presence validation
  if (!username || !password || !publicKey) {
    res.status(400).json({ message: 'Username, password, and publicKey are required.' });
    return; // Ensure we return to prevent further execution
  }

  // 2. Validate Uint8Array(32) hex format
  // 32 bytes = 64 hex characters. ^[0-9a-fA-F]{64}$ checks for exactly 64 hex chars.
  const hexRegex = /^[0-9a-fA-F]{64}$/;
  if (typeof publicKey !== 'string' || !hexRegex.test(publicKey)) {
    res.status(400).json({ message: 'Invalid format: publicKey must be a 64-character hex string (32 bytes).' });
    return;
  }

  try {
    // 3. Find the user first
    const user = await User.findOne({ username, password });

    if (!user) {
      res.status(404).json({ message: 'User not found or invalid credentials.' });
      return;
    }

    // 4. Check if the credential field already exists/matches
    // Assuming your DB field is named 'credential'
    if (user.publicKey) {
      res.status(200).json({ message: 'Already received a credential.' });
    } else {
      // 5. Store the hex if it doesn't exist
      user.publicKey = publicKey;
      await user.save();
      res.status(201).json({ message: 'Public key stored successfully.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Diffie Hellman Key Exchange

let universityKeys;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return Uint8Array.from(Buffer.from(base64, 'base64')).buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString('base64');
}

async function generateUniversityKeys() {
  const ecdh = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const ecdsa = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  return { ecdh, ecdsa };
}

async function exportKeyBase64(key: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey('spki', key);
  return arrayBufferToBase64(spki);
}

async function signData(privateKey: CryptoKey, data: ArrayBuffer): Promise<string> {
  return arrayBufferToBase64(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data));
}

async function importKey(spkiBase64: string, type: 'ECDSA' | 'ECDH'): Promise<CryptoKey> {
  const spki = base64ToArrayBuffer(spkiBase64);
  return await crypto.subtle.importKey('spki', spki, { name: type, namedCurve: 'P-256' }, true, ['verify']);
}

async function deriveSharedSecret(privateKey: CryptoKey, theirPublicKey: CryptoKey): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: theirPublicKey }, privateKey, 256));
}

// app.use(
//   cors({
//     origin: 'http://localhost',
//   }),
// );

// const PORT = process.env.PORT || 3000;
const PORT = 3000;

// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  console.log('starting run...');
  const config = new TestnetRemoteConfig();
  config.setNetworkId();
  logger = await createLogger(config.logDir);
  console.log('1 before run');
  await run(config, logger);
  console.log('2 after run');
});
