import { type VoteGuardianProviders } from '@midnight-ntwrk/vote-guardian-api';
import { type Ledger } from '@midnight-ntwrk/vote-guardian-contract';
import { type MidnightProvider, type WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import { type Resource } from '@midnight-ntwrk/wallet';
import { type Logger } from 'pino';
import type { DockerComposeEnvironment } from 'testcontainers';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import pino from 'pino';
import * as fs from 'node:fs';
export declare const createLogger: (logPath: string) => Promise<pino.Logger>;
export declare const currentDir: string;
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
export declare class StandaloneConfig implements Config {
    privateStateStoreName: string;
    logDir: string;
    zkConfigPath: string;
    indexer: string;
    indexerWS: string;
    node: string;
    proofServer: string;
    setNetworkId(): void;
}
export declare class TestnetRemoteConfig implements Config {
    privateStateStoreName: string;
    logDir: string;
    zkConfigPath: string;
    indexer: string;
    indexerWS: string;
    node: string;
    proofServer: string;
    setNetworkId(): void;
}
export declare const getVoteGuardianLedgerState: (providers: VoteGuardianProviders, contractAddress: ContractAddress) => Promise<Ledger | null>;
export declare const createWalletAndMidnightProvider: (wallet: Wallet) => Promise<WalletProvider & MidnightProvider>;
export declare const waitForSync: (wallet: Wallet) => Promise<import("@midnight-ntwrk/wallet-api").WalletState>;
export declare const waitForSyncProgress: (wallet: Wallet) => Promise<import("@midnight-ntwrk/wallet-api").WalletState>;
export declare const waitForFunds: (wallet: Wallet) => Promise<bigint>;
export declare const buildWalletAndWaitForFunds: ({ indexer, indexerWS, node, proofServer }: Config, seed: string, filename: string) => Promise<Wallet & Resource>;
export declare const run: (config: Config, logger: Logger, address: ContractAddress, voter_public_key: Uint8Array, voter_public_payment_key: Uint8Array, dockerEnv?: DockerComposeEnvironment) => Promise<void>;
export declare const streamToString: (stream: fs.ReadStream) => Promise<string>;
export declare const isAnotherChain: (wallet: Wallet, offset: number) => Promise<boolean>;
export declare const saveState: (wallet: Wallet, filename: string) => Promise<void>;
export declare const getSecretKeyFromContract: (contractAddress: string) => Promise<string>;
