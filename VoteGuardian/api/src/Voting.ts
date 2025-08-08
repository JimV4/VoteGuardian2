import type { VOTE_STATE } from '@midnight-ntwrk/vote-guardian-contract';

export class Voting {
  votingId: Uint8Array;
  votingOrganizer: Uint8Array;
  votingQuestion: string;
  votingOptions: Map<string, string>;
  votingResults: Map<string, bigint>;
  votingState: VOTE_STATE | null;

  constructor(
    votingId: Uint8Array,
    votingOrganizer: Uint8Array,
    votingQuestion: string,
    votingOptions: Map<string, string>,
    votingResults: Map<string, bigint>,
    votingState: VOTE_STATE | null,
  ) {
    this.votingId = votingId;
    this.votingOrganizer = votingOrganizer;
    this.votingQuestion = votingQuestion;
    this.votingOptions = votingOptions;
    this.votingResults = votingResults;
    this.votingState = votingState;
  }
}
