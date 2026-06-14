import type { Level } from './types';
import { createLevel as createBuildingLevel } from './officeBuilding';

export function createLevel(): Level {
  return createBuildingLevel();
}
