// Response shapes of the worlds API. Money is a string (minor units); dates are ISO strings so the
// views are JSON-safe, which idempotency replays rely on.

export interface WorldView {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly scenarioCode: string;
  readonly scenarioVersion: number;
  readonly currencyCode: string;
  readonly difficulty: string;
  readonly startingCapitalMinor: string;
  readonly modelVersion: string;
  readonly createdAt: string;
}

export interface ClockView {
  readonly currentTick: number;
  readonly calendar: {
    readonly year: number;
    readonly month: number;
    readonly day: number;
  };
  readonly simulationSpeed: number;
  readonly paused: boolean;
  readonly catchUpPolicy: string;
  readonly maxCatchUpTicks: number;
  readonly lastCompletedAt: string | null;
}
