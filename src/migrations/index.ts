import * as migration_20261025_041805_initial from './20261025_041805_initial';

export const migrations = [
  {
    up: migration_20261025_041805_initial.up,
    down: migration_20261025_041805_initial.down,
    name: '20261025_041805_initial'
  },
];
