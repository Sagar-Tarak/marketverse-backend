import type { ScenarioConfig } from '../functions/scenario-config.functions.js';

export interface ScenarioView {
  readonly code: string;
  readonly version: number;
  readonly name: string;
  readonly description: string | null;
  readonly currencyCode: string;
  readonly startDate: string;
}

export interface WorldMapView {
  readonly regions: readonly {
    readonly code: string;
    readonly name: string;
    readonly cities: readonly {
      readonly code: string;
      readonly name: string;
      readonly infrastructureCapacity: number;
    }[];
  }[];
}

export interface RouteView {
  readonly from: string;
  readonly to: string;
  readonly distanceKm: string;
  readonly transitTicks: number;
  readonly costPerUnitMinor: string;
}

/** A published scenario with its parsed config; used by world setup, not exposed as-is. */
export interface ScenarioRecord {
  readonly id: string;
  readonly code: string;
  readonly version: number;
  readonly startDate: Date;
  readonly currencyCode: string;
  readonly config: ScenarioConfig;
}

export interface InstantiatedMap {
  readonly regions: readonly { readonly id: string; readonly code: string }[];
  readonly cities: readonly {
    readonly id: string;
    readonly code: string;
    readonly regionId: string;
  }[];
  readonly routeCount: number;
}
