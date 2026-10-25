import * as migration_20261025_041805_initial from './20261025_041805_initial';
import * as migration_20261025_044636_inventory from './20261025_044636_inventory';
import * as migration_20261025_044959_model_config_details from './20261025_044959_model_config_details';

export const migrations = [
  {
    up: migration_20261025_041805_initial.up,
    down: migration_20261025_041805_initial.down,
    name: '20261025_041805_initial',
  },
  {
    up: migration_20261025_044636_inventory.up,
    down: migration_20261025_044636_inventory.down,
    name: '20261025_044636_inventory',
  },
  {
    up: migration_20261025_044959_model_config_details.up,
    down: migration_20261025_044959_model_config_details.down,
    name: '20261025_044959_model_config_details'
  },
];
