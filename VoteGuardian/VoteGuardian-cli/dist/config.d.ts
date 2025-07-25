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
export declare const currentDir: string;
export declare class TestnetLocalConfig implements Config {
    privateStateStoreName: string;
    logDir: string;
    zkConfigPath: string;
    indexer: string;
    indexerWS: string;
    node: string;
    proofServer: string;
    setNetworkId(): void;
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
