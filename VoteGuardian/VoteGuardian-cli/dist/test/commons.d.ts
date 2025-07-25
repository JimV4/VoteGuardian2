import { type Config, StandaloneConfig } from '../config';
export interface TestConfig {
    seed: string;
    entrypoint: string;
    dappConfig: Config;
    psMode: string;
}
export declare class LocalTestConfig implements TestConfig {
    seed: string;
    entrypoint: string;
    dappConfig: StandaloneConfig;
    psMode: string;
}
export declare function parseArgs(required: string[]): TestConfig;
