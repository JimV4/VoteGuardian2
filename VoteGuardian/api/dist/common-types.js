/**
 * VoteGuardian common types and abstractions.
 *
 * @module
 */
export function inMemoryPrivateStateProvider() {
    const btStateStore = new Map();
    const btSigningKeys = new Map();
    return {
        async set(privateStateId, state) {
            btStateStore.set(privateStateId, state);
        },
        async get(privateStateId) {
            return btStateStore.has(privateStateId) ? btStateStore.get(privateStateId) : null;
        },
        async remove(privateStateId) {
            btStateStore.delete(privateStateId);
        },
        async clear() {
            btStateStore.clear();
        },
        async setSigningKey(address, signingKey) {
            btSigningKeys.set(address, signingKey);
        },
        async getSigningKey(address) {
            return btSigningKeys.has(address) ? btSigningKeys.get(address) : null;
        },
        async removeSigningKey(address) {
            btSigningKeys.delete(address);
        },
        async clearSigningKeys() {
            btSigningKeys.clear();
        },
    };
}
//# sourceMappingURL=common-types.js.map