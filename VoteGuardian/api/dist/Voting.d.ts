import type { VOTE_STATE } from '@midnight-ntwrk/vote-guardian-contract';
export declare class Voting {
    votingId: Uint8Array;
    votingOrganizer: Uint8Array;
    votingQuestion: string;
    votingOptions: Map<string, string>;
    votingResults: Map<string, bigint>;
    votingState: VOTE_STATE | null;
    constructor(votingId: Uint8Array, votingOrganizer: Uint8Array, votingQuestion: string, votingOptions: Map<string, string>, votingResults: Map<string, bigint>, votingState: VOTE_STATE | null);
}
