import type { Seeder } from './seeder.js';

// ponytail: weights are placeholders; calibrate after the first simulation run.
// score = profit*E[profit] + growth*E[growth] - risk*risk - cashPenalty*cashPenalty
const STRATEGIES = [
  {
    code: 'COST_LEADER',
    name: 'Cost leader',
    description: 'Low unit cost through efficiency and bulk procurement.',
    weights: { profit: 1.0, growth: 0.5, risk: 0.6, cashPenalty: 0.8 },
  },
  {
    code: 'PREMIUM_SPECIALIST',
    name: 'Premium specialist',
    description: 'Quality and margin over volume.',
    weights: { profit: 1.2, growth: 0.3, risk: 0.7, cashPenalty: 0.6 },
  },
  {
    code: 'AGGRESSIVE_EXPANDER',
    name: 'Aggressive expander',
    description: 'Growth through capacity and borrowing within risk limits.',
    weights: { profit: 0.7, growth: 1.3, risk: 0.3, cashPenalty: 0.4 },
  },
  {
    code: 'CONSERVATIVE_OPERATOR',
    name: 'Conservative operator',
    description: 'Resilience: cash buffers, low leverage.',
    weights: { profit: 0.8, growth: 0.2, risk: 1.2, cashPenalty: 1.2 },
  },
  {
    code: 'INNOVATOR',
    name: 'Innovator',
    description: 'Productivity through research and process improvement.',
    weights: { profit: 0.8, growth: 0.9, risk: 0.6, cashPenalty: 0.6 },
  },
  {
    code: 'OPPORTUNIST',
    name: 'Opportunist',
    description:
      'Short-term return; reacts strongly to shortages and price gaps.',
    weights: { profit: 1.3, growth: 0.6, risk: 0.4, cashPenalty: 0.5 },
  },
] as const;

export const aiStrategiesSeeder: Seeder = {
  name: 'ai-strategies',
  async run(tx) {
    for (const strategy of STRATEGIES) {
      const values = {
        name: strategy.name,
        description: strategy.description,
        weights: strategy.weights,
      };
      await tx.aiStrategyTemplate.upsert({
        where: { code: strategy.code },
        update: values,
        create: { code: strategy.code, ...values },
      });
    }
  },
};
