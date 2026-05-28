import type {Spread, SpreadId} from './types.js';

export const spreads: readonly Spread[] = [
  {
    id: 'single',
    label: 'Single card',
    positions: ['Focus'],
    description: 'A compact lens for one question, mood, or daily direction.'
  },
  {
    id: 'three',
    label: 'Three cards',
    positions: ['Root', 'Present', 'Path'],
    description: 'A simple story arc: what shaped this, what is active, and what wants movement.'
  },
  {
    id: 'cross',
    label: 'Five-card cross',
    positions: ['Center', 'Challenge', 'Hidden influence', 'Advice', 'Likely movement'],
    description: 'A fuller reading for tangled questions without becoming a ceremony.'
  }
];

export const getSpread = (id: SpreadId): Spread => {
  const spread = spreads.find(candidate => candidate.id === id);

  if (!spread) {
    throw new Error(`Unknown spread: ${id}`);
  }

  return spread;
};
