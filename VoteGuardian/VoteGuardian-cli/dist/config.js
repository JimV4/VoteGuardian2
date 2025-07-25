import path from 'node:path';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
export class TestnetLocalConfig {
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
export class StandaloneConfig {
    privateStateStoreName = 'vote-guardian-private-state';
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
export class TestnetRemoteConfig {
    privateStateStoreName = 'vote-guardian-private-state';
    logDir = path.resolve(currentDir, '..', 'logs', 'testnet-remote', `${new Date().toISOString()}.log`);
    zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'dist', 'managed', 'vote-guardian');
    indexer = 'https://indexer.testnet-02.midnight.network/api/v1/graphql';
    indexerWS = 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws';
    node = 'https://rpc.testnet-02.midnight.network';
    proofServer = 'http://127.0.0.1:6300';
    setNetworkId() {
        setNetworkId(NetworkId.TestNet);
    }
}
//# sourceMappingURL=config.js.map