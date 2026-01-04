// /*
//  * This file is the main driver for the Midnight bulletin board example.
//  * The entry point is the run function, at the end of the file.
//  * We expect the startup files (testnet-remote.ts, standalone.ts, etc.) to
//  * call run with some specific configuration that sets the network addresses
//  * of the servers this file relies on.
//  */
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { WebSocket } from 'ws';
import { utils, } from '@midnight-ntwrk/vote-guardian-api';
import { createBalancedTx, } from '@midnight-ntwrk/midnight-js-types';
import * as Rx from 'rxjs';
import { nativeToken, Transaction } from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { WalletBuilder } from '@midnight-ntwrk/wallet';
import { StandaloneConfig } from './config.js';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
// //@ts-expect-error: It's needed to make Scala.js and WASM code able to use cryptography
// globalThis.crypto = webcrypto;
// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;
/* **********************************************************************
 * createWalletAndMidnightProvider: returns an object that
 * satifies both the WalletProvider and MidnightProvider
 * interfaces, both implemented in terms of the given wallet.
 */
const createWalletAndMidnightProvider = async (wallet) => {
    const state = await Rx.firstValueFrom(wallet.state());
    return {
        coinPublicKey: state.coinPublicKey,
        encryptionPublicKey: state.encryptionPublicKey,
        balanceTx(tx, newCoins) {
            return wallet
                .balanceTransaction(ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()), newCoins)
                .then((tx) => wallet.proveTransaction(tx))
                .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
                .then(createBalancedTx);
        },
        submitTx(tx) {
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
export const waitForFunds = (wallet, logger) => Rx.firstValueFrom(wallet.state().pipe(Rx.throttleTime(10_000), Rx.tap((state) => {
    const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
    const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
    logger.info(`Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`);
}), Rx.filter((state) => {
    // Let's allow progress only if wallet is synced
    return state.syncProgress?.synced === true;
}), Rx.map((s) => s.balances[nativeToken()] ?? 0n), Rx.filter((balance) => balance > 0n)));
/* **********************************************************************
 * buildWalletAndWaitForFunds: the main function that creates a wallet
 * and waits for tokens to appear in it.  The various "buildWallet"
 * functions all arrive here after collecting information for the
 * arguments.
 */
const buildWalletAndWaitForFunds = async ({ indexer, indexerWS, node, proofServer }, logger, seed) => {
    const wallet = await WalletBuilder.buildFromSeed(indexer, indexerWS, proofServer, node, seed, getZswapNetworkId(), 'warn');
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
const buildFreshWallet = async (config, logger) => await buildWalletAndWaitForFunds(config, logger, toHex(utils.randomBytes(32)));
// Prompt for a seed and create the wallet with that.
const buildWalletFromSeed = async (config, rli, logger) => {
    const seed = await rli.question('Enter your wallet seed: ');
    return await buildWalletAndWaitForFunds(config, logger, seed);
};
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
const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;
const buildWallet = async (config, rli, logger) => {
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
const mapContainerPort = (env, url, containerName) => {
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
export const run = async (config, logger, dockerEnv) => {
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
        async function sendNativeToken(address, amount) {
            const transferRecipe = await wallet.transferTransaction([
                {
                    amount,
                    receiverAddress: address,
                    type: nativeToken(),
                },
            ]);
            const transaction = await wallet.proveTransaction(transferRecipe);
            return await wallet.submitTransaction(transaction);
        }
        await sendNativeToken('mn_shield-addr_undeployed1m92uam8g5aw4w5zglpxxhx307qd52jau27em7sl6mhastqy62jnsxq8rl7ght0tahkv7st9lhhq0hwhp4e2je5wd5tlycdl9t6q4vf8gxyq3qzkm', 10000000000n);
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
//# sourceMappingURL=index.js.map