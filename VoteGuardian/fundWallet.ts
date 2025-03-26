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
import type { StartedDockerComposeEnvironment, DockerComposeEnvironment } from 'testcontainers';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import axios from 'axios';
import { type SignedCredential, type Signature } from '@midnight-ntwrk/university-contract';
import path from 'node:path';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

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

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export class TestnetLocalConfig implements Config {
  privateStateStoreName = 'vote-guardian-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'testnet-local', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'dist', 'managed', 'vote-guardian');
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';

  setNetworkId() {
    setNetworkId(NetworkId.TestNet);
  }
}

export class StandaloneConfig implements Config {
  privateStateStoreName = 'vote-guardian-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'dist', 'managed', 'vote-guardian');
  indexer = 'http://127.0.0.1:32779/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:32779/api/v1/graphql/ws';
  node = 'http://127.0.0.1:32777';
  proofServer = 'http://127.0.0.1:32778';

  setNetworkId() {
    setNetworkId(NetworkId.Undeployed);
  }
}

export class TestnetRemoteConfig implements Config {
  privateStateStoreName = 'vote-guardian-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'testnet-remote', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'dist', 'managed', 'vote-guardian');
  indexer = 'https://indexer.testnet.midnight.network/api/v1/graphql';
  indexerWS = 'wss://indexer.testnet.midnight.network/api/v1/graphql/ws';
  node = 'https://rpc.testnet.midnight.network';
  proofServer = 'http://127.0.0.1:6300';

  setNetworkId() {
    setNetworkId(NetworkId.TestNet);
  }
}

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
      '8d1e857e16eec730b784a343654671c6d9ebe14c48a81570880a0c880365b1bd|030087e855e8c04bd42f518267b1f729a72b7b56f57d0a5b8134517630bdfce1955eee49854c41e984cac6010254b865a22d50ffeb31248f291b',
      10000000000n,
    );
  }
};
