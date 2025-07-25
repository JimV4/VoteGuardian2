import { type Wallet } from '@midnight-ntwrk/wallet-api';
import { type Logger } from 'pino';
import { type Config } from './config.js';
import type { DockerComposeEnvironment } from 'testcontainers';
export declare const waitForFunds: (wallet: Wallet, logger: Logger) => Promise<bigint>;
export declare const run: (config: Config, logger: Logger, dockerEnv?: DockerComposeEnvironment) => Promise<void>;
