'use strict';
const __compactRuntime = require('@midnight-ntwrk/compact-runtime');
const expectedRuntimeVersionString = '0.8.1';
const expectedRuntimeVersion = expectedRuntimeVersionString.split('-')[0].split('.').map(Number);
const actualRuntimeVersion = __compactRuntime.versionString.split('-')[0].split('.').map(Number);
if (expectedRuntimeVersion[0] != actualRuntimeVersion[0]
     || (actualRuntimeVersion[0] == 0 && expectedRuntimeVersion[1] != actualRuntimeVersion[1])
     || expectedRuntimeVersion[1] > actualRuntimeVersion[1]
     || (expectedRuntimeVersion[1] == actualRuntimeVersion[1] && expectedRuntimeVersion[2] > actualRuntimeVersion[2]))
   throw new __compactRuntime.CompactError(`Version mismatch: compiled code expects ${expectedRuntimeVersionString}, runtime is ${__compactRuntime.versionString}`);
{ const MAX_FIELD = 52435875175126190479447740508185965837690552500527637822603658699938581184512n;
  if (__compactRuntime.MAX_FIELD !== MAX_FIELD)
     throw new __compactRuntime.CompactError(`compiler thinks maximum field value is ${MAX_FIELD}; run time thinks it is ${__compactRuntime.MAX_FIELD}`)
}

var VOTE_STATE;
(function (VOTE_STATE) {
  VOTE_STATE[VOTE_STATE['open'] = 0] = 'open';
  VOTE_STATE[VOTE_STATE['closed'] = 1] = 'closed';
})(VOTE_STATE = exports.VOTE_STATE || (exports.VOTE_STATE = {}));

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeOpaqueString();

const _descriptor_2 = new __compactRuntime.CompactTypeEnum(1, 1);

const _descriptor_3 = new __compactRuntime.CompactTypeField();

class _MerkleTreeDigest_0 {
  alignment() {
    return _descriptor_3.alignment();
  }
  fromValue(value_0) {
    return {
      field: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.field);
  }
}

const _descriptor_4 = new _MerkleTreeDigest_0();

const _descriptor_5 = new __compactRuntime.CompactTypeBoolean();

const _descriptor_6 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

class _MerkleTreePathEntry_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_5.alignment());
  }
  fromValue(value_0) {
    return {
      sibling: _descriptor_4.fromValue(value_0),
      goes_left: _descriptor_5.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.sibling).concat(_descriptor_5.toValue(value_0.goes_left));
  }
}

const _descriptor_7 = new _MerkleTreePathEntry_0();

const _descriptor_8 = new __compactRuntime.CompactTypeVector(10, _descriptor_7);

class _MerkleTreePath_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_8.alignment());
  }
  fromValue(value_0) {
    return {
      leaf: _descriptor_0.fromValue(value_0),
      path: _descriptor_8.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.leaf).concat(_descriptor_8.toValue(value_0.path));
  }
}

const _descriptor_9 = new _MerkleTreePath_0();

class _ZswapCoinPublicKey_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_10 = new _ZswapCoinPublicKey_0();

const _descriptor_11 = new __compactRuntime.CompactTypeBytes(6);

class _LeafPreimage_0 {
  alignment() {
    return _descriptor_11.alignment().concat(_descriptor_0.alignment());
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_11.fromValue(value_0),
      data: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_11.toValue(value_0.domain_sep).concat(_descriptor_0.toValue(value_0.data));
  }
}

const _descriptor_12 = new _LeafPreimage_0();

const _descriptor_13 = new __compactRuntime.CompactTypeVector(2, _descriptor_3);

const _descriptor_14 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_15 = new _ContractAddress_0();

const _descriptor_16 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class _Maybe_0 {
  alignment() {
    return _descriptor_5.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_5.fromValue(value_0),
      value: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.is_some).concat(_descriptor_1.toValue(value_0.value));
  }
}

const _descriptor_17 = new _Maybe_0();

const _descriptor_18 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1)
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    if (typeof(witnesses_0.local_secret_key) !== 'function')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named local_secret_key');
    if (typeof(witnesses_0.find_voter_public_key) !== 'function')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named find_voter_public_key');
    this.witnesses = witnesses_0;
    this.circuits = {
      add_voter: (...args_1) => {
        if (args_1.length !== 2)
          throw new __compactRuntime.CompactError(`add_voter: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const voter_public_key_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('add_voter',
                                      'argument 1 (as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 51, char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(voter_public_key_0.buffer instanceof ArrayBuffer && voter_public_key_0.BYTES_PER_ELEMENT === 1 && voter_public_key_0.length === 32))
          __compactRuntime.type_error('add_voter',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 51, char 1',
                                      'Bytes<32>',
                                      voter_public_key_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(voter_public_key_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_add_voter_0(context,
                                            partialProofData,
                                            voter_public_key_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      record_payment_key: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`record_payment_key: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const voter_public_key_0 = args_1[1];
        const voter_public_payment_key_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('record_payment_key',
                                      'argument 1 (as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 62, char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(voter_public_key_0.buffer instanceof ArrayBuffer && voter_public_key_0.BYTES_PER_ELEMENT === 1 && voter_public_key_0.length === 32))
          __compactRuntime.type_error('record_payment_key',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 62, char 1',
                                      'Bytes<32>',
                                      voter_public_key_0)
        if (!(voter_public_payment_key_0.buffer instanceof ArrayBuffer && voter_public_payment_key_0.BYTES_PER_ELEMENT === 1 && voter_public_payment_key_0.length === 32))
          __compactRuntime.type_error('record_payment_key',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 62, char 1',
                                      'Bytes<32>',
                                      voter_public_payment_key_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(voter_public_key_0).concat(_descriptor_0.toValue(voter_public_payment_key_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_record_payment_key_0(context,
                                                     partialProofData,
                                                     voter_public_key_0,
                                                     voter_public_payment_key_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      cast_vote: (...args_1) => {
        if (args_1.length !== 2)
          throw new __compactRuntime.CompactError(`cast_vote: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const vote_option_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('cast_vote',
                                      'argument 1 (as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 68, char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(vote_option_0),
            alignment: _descriptor_1.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_cast_vote_0(context,
                                            partialProofData,
                                            vote_option_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      close_voting: (...args_1) => {
        if (args_1.length !== 1)
          throw new __compactRuntime.CompactError(`close_voting: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('close_voting',
                                      'argument 1 (as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 110, char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_close_voting_0(context, partialProofData);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      open_voting: (...args_1) => {
        if (args_1.length !== 1)
          throw new __compactRuntime.CompactError(`open_voting: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('open_voting',
                                      'argument 1 (as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 120, char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_open_voting_0(context, partialProofData);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      create_voting: (...args_1) => {
        if (args_1.length !== 2)
          throw new __compactRuntime.CompactError(`create_voting: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const vq_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('create_voting',
                                      'argument 1 (as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 129, char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(vq_0),
            alignment: _descriptor_1.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_create_voting_0(context, partialProofData, vq_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      add_option: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`add_option: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const vote_option_0 = args_1[1];
        const i_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('add_option',
                                      'argument 1 (as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 135, char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(vote_option_0).concat(_descriptor_1.toValue(i_0)),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_add_option_0(context,
                                             partialProofData,
                                             vote_option_0,
                                             i_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      public_key: (...args_1) => {
        if (args_1.length !== 2)
          throw new __compactRuntime.CompactError(`public_key: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const sk_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('public_key',
                                      'argument 1 (as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 144, char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32))
          __compactRuntime.type_error('public_key',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'src/VoteGuardian.compact line 144, char 1',
                                      'Bytes<32>',
                                      sk_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(sk_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_public_key_0(context, partialProofData, sk_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      }
    };
    this.impureCircuits = {
      add_voter: this.circuits.add_voter,
      record_payment_key: this.circuits.record_payment_key,
      cast_vote: this.circuits.cast_vote,
      close_voting: this.circuits.close_voting,
      open_voting: this.circuits.open_voting,
      create_voting: this.circuits.create_voting,
      add_option: this.circuits.add_option
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1)
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = stateValue_0;
    state_0.setOperation('add_voter', new __compactRuntime.ContractOperation());
    state_0.setOperation('record_payment_key', new __compactRuntime.ContractOperation());
    state_0.setOperation('cast_vote', new __compactRuntime.ContractOperation());
    state_0.setOperation('close_voting', new __compactRuntime.ContractOperation());
    state_0.setOperation('open_voting', new __compactRuntime.ContractOperation());
    state_0.setOperation('create_voting', new __compactRuntime.ContractOperation());
    state_0.setOperation('add_option', new __compactRuntime.ContractOperation());
    const context = {
      originalState: state_0,
      currentPrivateState: constructorContext_0.initialPrivateState,
      currentZswapLocalState: constructorContext_0.initialZswapLocalState,
      transactionContext: new __compactRuntime.QueryContext(state_0.data, __compactRuntime.dummyContractAddress())
    };
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(0n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new Uint8Array(32)),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(1n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0),
                                                                            alignment: _descriptor_2.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(2n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newArray()
                                        .arrayPush(__compactRuntime.StateValue.newBoundedMerkleTree(
                                                     new __compactRuntime.StateBoundedMerkleTree(10)
                                                   )).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_16.toValue(0n),
                                                                                                      alignment: _descriptor_16.alignment() })).arrayPush(__compactRuntime.StateValue.newMap(
                                                                                                                                                            new __compactRuntime.StateMap()
                                                                                                                                                          ))
                                        .encode() } },
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(2n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { dup: { n: 2 } },
                     { idx: { cached: false,
                              pushPath: false,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(0n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     'root',
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newNull().encode() } },
                     { ins: { cached: true, n: 2 } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(3n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(4n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newArray()
                                        .arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_16.toValue(0n),
                                                                                                                                                                                           alignment: _descriptor_16.alignment() }))
                                        .encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(5n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_16.toValue(0n),
                                                                            alignment: _descriptor_16.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(6n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(''),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(7n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(8n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    const tmp_0 = this.#_public_key_0(context,
                                      partialProofData,
                                      this.#_local_secret_key_0(context,
                                                                partialProofData));
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(0n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(1n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0),
                                                                            alignment: _descriptor_2.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    const tmp_1 = 0n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(5n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                            { value: _descriptor_6.toValue(tmp_1),
                                              alignment: _descriptor_6.alignment() }
                                              .value
                                          )) } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(2n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newArray()
                                        .arrayPush(__compactRuntime.StateValue.newBoundedMerkleTree(
                                                     new __compactRuntime.StateBoundedMerkleTree(10)
                                                   )).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_16.toValue(0n),
                                                                                                      alignment: _descriptor_16.alignment() })).arrayPush(__compactRuntime.StateValue.newMap(
                                                                                                                                                            new __compactRuntime.StateMap()
                                                                                                                                                          ))
                                        .encode() } },
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(2n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { dup: { n: 2 } },
                     { idx: { cached: false,
                              pushPath: false,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(0n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     'root',
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newNull().encode() } },
                     { ins: { cached: true, n: 2 } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(3n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    state_0.data = context.transactionContext.state;
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  #_transient_hash_0(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_13, value_0);
    return result_0;
  }
  #_persistent_hash_0(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_14, value_0);
    return result_0;
  }
  #_persistent_hash_1(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_12, value_0);
    return result_0;
  }
  #_persistent_hash_2(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_0, value_0);
    return result_0;
  }
  #_degrade_to_transient_0(context, partialProofData, x_0) {
    const result_0 = __compactRuntime.degradeToTransient(x_0);
    return result_0;
  }
  #_merkle_tree_path_root_0(context, partialProofData, path_0) {
    return { field:
               this.#_folder_0(context,
                               partialProofData,
                               (...args_0) =>
                                 this.#_merkle_tree_path_entry_root_0(...args_0),
                               this.#_degrade_to_transient_0(context,
                                                             partialProofData,
                                                             this.#_persistent_hash_1(context,
                                                                                      partialProofData,
                                                                                      { domain_sep:
                                                                                          new Uint8Array([109, 100, 110, 58, 108, 104]),
                                                                                        data:
                                                                                          path_0.leaf })),
                               path_0.path) };
  }
  #_merkle_tree_path_entry_root_0(context,
                                  partialProofData,
                                  recursive_digest_0,
                                  entry_0)
  {
    const left_0 = entry_0.goes_left? recursive_digest_0 : entry_0.sibling.field;
    const right_0 = entry_0.goes_left?
                    entry_0.sibling.field :
                    recursive_digest_0;
    return this.#_transient_hash_0(context, partialProofData, [left_0, right_0]);
  }
  #_own_public_key_0(context, partialProofData) {
    const result_0 = __compactRuntime.ownPublicKey(context);
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_10.toValue(result_0),
      alignment: _descriptor_10.alignment()
    });
    return result_0;
  }
  #_local_secret_key_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.witnessContext(ledger(context.transactionContext.state), context.currentPrivateState, context.transactionContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.local_secret_key(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32))
      __compactRuntime.type_error('local_secret_key',
                                  'return value',
                                  'src/VoteGuardian.compact line 45, char 1',
                                  'Bytes<32>',
                                  result_0)
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  #_find_voter_public_key_0(context, partialProofData, voter_public_key_0) {
    const witnessContext_0 = __compactRuntime.witnessContext(ledger(context.transactionContext.state), context.currentPrivateState, context.transactionContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.find_voter_public_key(witnessContext_0,
                                                                                voter_public_key_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.leaf.buffer instanceof ArrayBuffer && result_0.leaf.BYTES_PER_ELEMENT === 1 && result_0.leaf.length === 32 && Array.isArray(result_0.path) && result_0.path.length === 10 && result_0.path.every((t) => typeof(t) === 'object' && typeof(t.sibling) === 'object' && typeof(t.sibling.field) === 'bigint' && t.sibling.field >= 0 && t.sibling.field <= __compactRuntime.MAX_FIELD && typeof(t.goes_left) === 'boolean')))
      __compactRuntime.type_error('find_voter_public_key',
                                  'return value',
                                  'src/VoteGuardian.compact line 48, char 1',
                                  'struct MerkleTreePath<leaf: Bytes<32>, path: Vector<10, struct MerkleTreePathEntry<sibling: struct MerkleTreeDigest<field: Field>, goes_left: Boolean>>>',
                                  result_0)
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_9.toValue(result_0),
      alignment: _descriptor_9.alignment()
    });
    return result_0;
  }
  #_add_voter_0(context, partialProofData, voter_public_key_0) {
    __compactRuntime.assert(this.#_equal_0(_descriptor_0.fromValue(Contract._query(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_18.toValue(0n),
                                                                                                               alignment: _descriptor_18.alignment() } }] } },
                                                                                    { popeq: { cached: false,
                                                                                               result: undefined } }]).value),
                                           this.#_public_key_0(context,
                                                               partialProofData,
                                                               this.#_local_secret_key_0(context,
                                                                                         partialProofData))),
                            'You are not authorized to add a voter!');
    __compactRuntime.assert(!this.#_equal_1(voter_public_key_0,
                                            this.#_public_key_0(context,
                                                                partialProofData,
                                                                this.#_local_secret_key_0(context,
                                                                                          partialProofData))),
                            'You cannot add yourself to the voting!');
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(2n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(0n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { dup: { n: 2 } },
                     { idx: { cached: false,
                              pushPath: false,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(1n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell(__compactRuntime.leafHash(
                                                                            { value: _descriptor_0.toValue(voter_public_key_0),
                                                                              alignment: _descriptor_0.alignment() }
                                                                          )).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } },
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(1n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { addi: { immediate: 1 } },
                     { ins: { cached: true, n: 1 } },
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(2n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { dup: { n: 2 } },
                     { idx: { cached: false,
                              pushPath: false,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(0n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     'root',
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newNull().encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    return [];
  }
  #_record_payment_key_0(context,
                         partialProofData,
                         voter_public_key_0,
                         voter_public_payment_key_0)
  {
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(7n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(voter_public_payment_key_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(voter_public_key_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  #_cast_vote_0(context, partialProofData, vote_option_0) {
    __compactRuntime.assert(!this.#_equal_2(_descriptor_0.fromValue(Contract._query(context,
                                                                                    partialProofData,
                                                                                    [
                                                                                     { dup: { n: 0 } },
                                                                                     { idx: { cached: false,
                                                                                              pushPath: false,
                                                                                              path: [
                                                                                                     { tag: 'value',
                                                                                                       value: { value: _descriptor_18.toValue(0n),
                                                                                                                alignment: _descriptor_18.alignment() } }] } },
                                                                                     { popeq: { cached: false,
                                                                                                result: undefined } }]).value),
                                            this.#_public_key_0(context,
                                                                partialProofData,
                                                                this.#_local_secret_key_0(context,
                                                                                          partialProofData))),
                            'As organizer, you are not allowed to vote!');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_18.toValue(1n),
                                                                                                alignment: _descriptor_18.alignment() } }] } },
                                                                     { popeq: { cached: false,
                                                                                result: undefined } }]).value)
                            ===
                            0,
                            'Voting is not open');
    const voter_public_key_0 = this.#_public_key_0(context,
                                                   partialProofData,
                                                   this.#_local_secret_key_0(context,
                                                                             partialProofData));
    const voter_public_payment_key_struct_0 = this.#_own_public_key_0(context,
                                                                      partialProofData);
    const voter_public_payment_key_bytes_0 = voter_public_payment_key_struct_0.bytes;
    const voter_public_key_from_map_0 = _descriptor_0.fromValue(Contract._query(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 0 } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_18.toValue(7n),
                                                                                                            alignment: _descriptor_18.alignment() } }] } },
                                                                                 { idx: { cached: false,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_0.toValue(voter_public_payment_key_bytes_0),
                                                                                                            alignment: _descriptor_0.alignment() } }] } },
                                                                                 { popeq: { cached: false,
                                                                                            result: undefined } }]).value);
    __compactRuntime.assert(this.#_equal_3(voter_public_key_from_map_0,
                                           voter_public_key_0),
                            'Voter public key does not match with voter public payment key');
    const path_0 = this.#_find_voter_public_key_0(context,
                                                  partialProofData,
                                                  voter_public_key_0);
    let tmp_0;
    __compactRuntime.assert((tmp_0 = this.#_merkle_tree_path_root_0(context,
                                                                    partialProofData,
                                                                    path_0),
                             _descriptor_5.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_18.toValue(2n),
                                                                                                 alignment: _descriptor_18.alignment() } }] } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_18.toValue(2n),
                                                                                                 alignment: _descriptor_18.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                                                             alignment: _descriptor_4.alignment() }).encode() } },
                                                                      'member',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value)),
                            'You are not authorized to vote!');
    const voting_nullifier_0 = this.#_nullifier_0(context,
                                                  partialProofData,
                                                  this.#_local_secret_key_0(context,
                                                                            partialProofData));
    __compactRuntime.assert(!_descriptor_5.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_18.toValue(3n),
                                                                                                 alignment: _descriptor_18.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(voting_nullifier_0),
                                                                                                                             alignment: _descriptor_0.alignment() }).encode() } },
                                                                      'member',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value),
                            'You have already voted!');
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(3n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(voting_nullifier_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newNull().encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    __compactRuntime.assert(_descriptor_5.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_18.toValue(8n),
                                                                                                alignment: _descriptor_18.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(vote_option_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Not a valid option!');
    const vote_0 = _descriptor_1.fromValue(Contract._query(context,
                                                           partialProofData,
                                                           [
                                                            { dup: { n: 0 } },
                                                            { idx: { cached: false,
                                                                     pushPath: false,
                                                                     path: [
                                                                            { tag: 'value',
                                                                              value: { value: _descriptor_18.toValue(8n),
                                                                                       alignment: _descriptor_18.alignment() } }] } },
                                                            { idx: { cached: false,
                                                                     pushPath: false,
                                                                     path: [
                                                                            { tag: 'value',
                                                                              value: { value: _descriptor_1.toValue(vote_option_0),
                                                                                       alignment: _descriptor_1.alignment() } }] } },
                                                            { popeq: { cached: false,
                                                                       result: undefined } }]).value);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(4n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { dup: { n: 0 } },
                     { idx: { cached: false,
                              pushPath: false,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(2n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { addi: { immediate: 1 } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newArray()
                                        .arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(vote_0),
                                                                                         alignment: _descriptor_1.alignment() })).arrayPush(__compactRuntime.StateValue.newNull()).arrayPush(__compactRuntime.StateValue.newNull())
                                        .encode() } },
                     { swap: { n: 0 } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(2n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { swap: { n: 0 } },
                     { ins: { cached: true, n: 1 } },
                     { swap: { n: 0 } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(1n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { swap: { n: 0 } },
                     { ins: { cached: true, n: 2 } }]);
    const tmp_1 = 1n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(5n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                            { value: _descriptor_6.toValue(tmp_1),
                                              alignment: _descriptor_6.alignment() }
                                              .value
                                          )) } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  #_close_voting_0(context, partialProofData) {
    __compactRuntime.assert(this.#_equal_4(_descriptor_0.fromValue(Contract._query(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_18.toValue(0n),
                                                                                                               alignment: _descriptor_18.alignment() } }] } },
                                                                                    { popeq: { cached: false,
                                                                                               result: undefined } }]).value),
                                           this.#_public_key_0(context,
                                                               partialProofData,
                                                               this.#_local_secret_key_0(context,
                                                                                         partialProofData))),
                            'You are not authorized to close the voting');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_18.toValue(1n),
                                                                                                alignment: _descriptor_18.alignment() } }] } },
                                                                     { popeq: { cached: false,
                                                                                result: undefined } }]).value)
                            ===
                            0,
                            'Voting phase is not open or has already closed');
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(1n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(1),
                                                                            alignment: _descriptor_2.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  #_open_voting_0(context, partialProofData) {
    __compactRuntime.assert(this.#_equal_5(_descriptor_0.fromValue(Contract._query(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_18.toValue(0n),
                                                                                                               alignment: _descriptor_18.alignment() } }] } },
                                                                                    { popeq: { cached: false,
                                                                                               result: undefined } }]).value),
                                           this.#_public_key_0(context,
                                                               partialProofData,
                                                               this.#_local_secret_key_0(context,
                                                                                         partialProofData))),
                            'You are not authorized to open the voting');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_18.toValue(1n),
                                                                                                alignment: _descriptor_18.alignment() } }] } },
                                                                     { popeq: { cached: false,
                                                                                result: undefined } }]).value)
                            ===
                            1,
                            'Voting phase is not closed or has already opened');
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(1n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0),
                                                                            alignment: _descriptor_2.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  #_create_voting_0(context, partialProofData, vq_0) {
    __compactRuntime.assert(this.#_equal_6(_descriptor_0.fromValue(Contract._query(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_18.toValue(0n),
                                                                                                               alignment: _descriptor_18.alignment() } }] } },
                                                                                    { popeq: { cached: false,
                                                                                               result: undefined } }]).value),
                                           this.#_public_key_0(context,
                                                               partialProofData,
                                                               this.#_local_secret_key_0(context,
                                                                                         partialProofData))),
                            'You are not authorized to start a voting');
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(6n),
                                                                            alignment: _descriptor_18.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(vq_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  #_add_option_0(context, partialProofData, vote_option_0, i_0) {
    __compactRuntime.assert(this.#_equal_7(_descriptor_0.fromValue(Contract._query(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_18.toValue(0n),
                                                                                                               alignment: _descriptor_18.alignment() } }] } },
                                                                                    { popeq: { cached: false,
                                                                                               result: undefined } }]).value),
                                           this.#_public_key_0(context,
                                                               partialProofData,
                                                               this.#_local_secret_key_0(context,
                                                                                         partialProofData))),
                            'You are not authorized to add a voting option!');
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_18.toValue(8n),
                                                alignment: _descriptor_18.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(i_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(vote_option_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  #_public_key_0(context, partialProofData, sk_0) {
    return this.#_persistent_hash_2(context, partialProofData, sk_0);
  }
  #_nullifier_0(context, partialProofData, sk_0) {
    return this.#_persistent_hash_0(context,
                                    partialProofData,
                                    [new Uint8Array([110, 117, 108, 108, 105, 102, 105, 101, 114, 45, 100, 111, 109, 97, 105, 110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                     sk_0]);
  }
  #_folder_0(context, partialProofData, f, x, a0)
  {
    for (let i = 0; i < 10; i++) x = f(context, partialProofData, x, a0[i]);
    return x;
  }
  #_equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_6(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  static _query(context, partialProofData, prog) {
    var res;
    try {
      res = context.transactionContext.query(prog, __compactRuntime.CostModel.dummyCostModel());
    } catch (err) {
      throw new __compactRuntime.CompactError(err.toString());
    }
    context.transactionContext = res.context;
    var reads = res.events.filter((e) => e.tag === 'read');
    var i = 0;
    partialProofData.publicTranscript = partialProofData.publicTranscript.concat(prog.map((op) => {
      if(typeof(op) === 'object' && 'popeq' in op) {
        return { popeq: {
          ...op.popeq,
          result: reads[i++].content,
        } };
      } else {
        return op;
      }
    }));
    if(res.events.length == 1 && res.events[0].tag === 'read') {
      return res.events[0].content;
    } else {
      return res.events;
    }
  }
}
function ledger(state) {
  const context = {
    originalState: state,
    transactionContext: new __compactRuntime.QueryContext(state, __compactRuntime.dummyContractAddress())
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get votingOrganizer() {
      return _descriptor_0.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_18.toValue(0n),
                                                                                 alignment: _descriptor_18.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    },
    get voteState() {
      return _descriptor_2.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_18.toValue(1n),
                                                                                 alignment: _descriptor_18.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    },
    eligibleVoters: {
      isFull(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`is_full: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_5.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(2n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(1n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_16.toValue(1024n),
                                                                                                               alignment: _descriptor_16.alignment() }).encode() } },
                                                        'lt',
                                                        'neg',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      checkRoot(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`check_root: expected 1 argument, received ${args_0.length}`);
        const rt_0 = args_0[0];
        if (!(typeof(rt_0) === 'object' && typeof(rt_0.field) === 'bigint' && rt_0.field >= 0 && rt_0.field <= __compactRuntime.MAX_FIELD))
          __compactRuntime.type_error('check_root',
                                      'argument 1',
                                      'src/VoteGuardian.compact line 14, char 1',
                                      'struct MerkleTreeDigest<field: Field>',
                                      rt_0)
        return _descriptor_5.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(2n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(2n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(rt_0),
                                                                                                               alignment: _descriptor_4.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      root(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`root: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[2];
        return new __compactRuntime.CompactTypeMerkleTreeDigest().fromValue(self_0.asArray()[0].asBoundedMerkleTree().root());
      },
      firstFree(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`first_free: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[2];
        return new __compactRuntime.CompactTypeField().fromValue(self_0.asArray()[1].asCell().value);
      },
      pathForLeaf(...args_0) {
        if (args_0.length !== 2)
          throw new __compactRuntime.CompactError(`path_for_leaf: expected 2 arguments, received ${args_0.length}`);
        const index_0 = args_0[0];
        const leaf_0 = args_0[1];
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0 && index_0 <= __compactRuntime.MAX_FIELD))
          __compactRuntime.type_error('path_for_leaf',
                                      'argument 1',
                                      'src/VoteGuardian.compact line 14, char 1',
                                      'Field',
                                      index_0)
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32))
          __compactRuntime.type_error('path_for_leaf',
                                      'argument 2',
                                      'src/VoteGuardian.compact line 14, char 1',
                                      'Bytes<32>',
                                      leaf_0)
        const self_0 = state.asArray()[2];
        return new __compactRuntime.CompactTypeMerkleTreePath(10, _descriptor_0).fromValue(  self_0.asArray()[0].asBoundedMerkleTree().pathForLeaf(    index_0,    {      value: _descriptor_0.toValue(leaf_0),      alignment: _descriptor_0.alignment()    }  ).value);
      },
      findPathForLeaf(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`find_path_for_leaf: expected 1 argument, received ${args_0.length}`);
        const leaf_0 = args_0[0];
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32))
          __compactRuntime.type_error('find_path_for_leaf',
                                      'argument 1',
                                      'src/VoteGuardian.compact line 14, char 1',
                                      'Bytes<32>',
                                      leaf_0)
        const self_0 = state.asArray()[2];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(10, _descriptor_0).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().findPathForLeaf(    {      value: _descriptor_0.toValue(leaf_0),      alignment: _descriptor_0.alignment()    }  )?.value);
      },
      history(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`history: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[2];
        return self_0.asArray()[2].asMap().keys().map(  (elem) => new __compactRuntime.CompactTypeMerkleTreeDigest().fromValue(elem.value))[Symbol.iterator]();
      }
    },
    votingNulifiers: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`is_empty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_5.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(3n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_16.toValue(0n),
                                                                                                               alignment: _descriptor_16.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_16.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_18.toValue(3n),
                                                                                    alignment: _descriptor_18.alignment() } }] } },
                                                         'size',
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'src/VoteGuardian.compact line 17, char 1',
                                      'Bytes<32>',
                                      elem_0)
        return _descriptor_5.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(3n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(elem_0),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[3];
        return self_0.asMap().keys().map((elem) => _descriptor_0.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    votesList: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`is_empty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_5.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(4n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(1n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        'type',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(1n),
                                                                                                               alignment: _descriptor_18.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      length(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`length: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_16.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_18.toValue(4n),
                                                                                    alignment: _descriptor_18.alignment() } }] } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_18.toValue(2n),
                                                                                    alignment: _descriptor_18.alignment() } }] } },
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      head(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`head: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_17.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_18.toValue(4n),
                                                                                    alignment: _descriptor_18.alignment() } }] } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_18.toValue(0n),
                                                                                    alignment: _descriptor_18.alignment() } }] } },
                                                         { dup: { n: 0 } },
                                                         'type',
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(1n),
                                                                                                                alignment: _descriptor_18.alignment() }).encode() } },
                                                         'eq',
                                                         { branch: { skip: 4 } },
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_18.toValue(1n),
                                                                                                                alignment: _descriptor_18.alignment() }).encode() } },
                                                         { swap: { n: 0 } },
                                                         { concat: { cached: false,
                                                                     n: (2+Number(__compactRuntime.maxAlignedSize(
                                                                             _descriptor_1
                                                                             .alignment()
                                                                           ))) } },
                                                         { jmp: { skip: 2 } },
                                                         'pop',
                                                         { push: { storage: false,
                                                                   value: __compactRuntime.StateValue.newCell(__compactRuntime.alignedConcat(
                                                                                                                { value: _descriptor_18.toValue(0n),
                                                                                                                  alignment: _descriptor_18.alignment() },
                                                                                                                { value: _descriptor_1.toValue(''),
                                                                                                                  alignment: _descriptor_1.alignment() }
                                                                                                              )).encode() } },
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[4];
        return (() => {  var iter = { curr: self_0 };  iter.next = () => {    const arr = iter.curr.asArray();    const head = arr[0];    if(head.type() == "null") {      return { done: true };    } else {      iter.curr = arr[1];      return { value: _descriptor_1.fromValue(head.asCell().value), done: false };    }  };  return iter;})();
      }
    },
    get voteCount() {
      return _descriptor_16.fromValue(Contract._query(context,
                                                      partialProofData,
                                                      [
                                                       { dup: { n: 0 } },
                                                       { idx: { cached: false,
                                                                pushPath: false,
                                                                path: [
                                                                       { tag: 'value',
                                                                         value: { value: _descriptor_18.toValue(5n),
                                                                                  alignment: _descriptor_18.alignment() } }] } },
                                                       { popeq: { cached: true,
                                                                  result: undefined } }]).value);
    },
    get voteQuestion() {
      return _descriptor_1.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_18.toValue(6n),
                                                                                 alignment: _descriptor_18.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    },
    mapPublicPayment: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`is_empty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_5.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(7n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_16.toValue(0n),
                                                                                                               alignment: _descriptor_16.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_16.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_18.toValue(7n),
                                                                                    alignment: _descriptor_18.alignment() } }] } },
                                                         'size',
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'src/VoteGuardian.compact line 29, char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_5.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(7n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'src/VoteGuardian.compact line 29, char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(7n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_0.toValue(key_0),
                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[7];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    voteOptionMap: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`is_empty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_5.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(8n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_16.toValue(0n),
                                                                                                               alignment: _descriptor_16.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_16.fromValue(Contract._query(context,
                                                        partialProofData,
                                                        [
                                                         { dup: { n: 0 } },
                                                         { idx: { cached: false,
                                                                  pushPath: false,
                                                                  path: [
                                                                         { tag: 'value',
                                                                           value: { value: _descriptor_18.toValue(8n),
                                                                                    alignment: _descriptor_18.alignment() } }] } },
                                                         'size',
                                                         { popeq: { cached: true,
                                                                    result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        return _descriptor_5.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(8n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        return _descriptor_1.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_18.toValue(8n),
                                                                                   alignment: _descriptor_18.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[8];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_1.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  originalState: new __compactRuntime.ContractState(),
  transactionContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  local_secret_key: (...args) => undefined,
  find_voter_public_key: (...args) => undefined
});
const pureCircuits = {
  public_key: (...args_0) => _dummyContract.circuits.public_key(_emptyContext, ...args_0).result
};
const contractReferenceLocations = { tag: 'publicLedgerArray', indices: { } };
exports.Contract = Contract;
exports.ledger = ledger;
exports.pureCircuits = pureCircuits;
exports.contractReferenceLocations = contractReferenceLocations;
//# sourceMappingURL=index.cjs.map
