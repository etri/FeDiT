// Type definitions for solvers

export interface SolverOption {
  name: string;
  badge: string;
  badgeType: 'recommended' | 'experimental' | 'custom';
  description: string;
  features: string[];
  performance: string;
}
