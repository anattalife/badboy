import * as migration_20261025_041805_initial from './20261025_041805_initial';
import * as migration_20261025_044636_inventory from './20261025_044636_inventory';
import * as migration_20261025_044959_model_config_details from './20261025_044959_model_config_details';
import * as migration_20261025_164330_leads_credit_apps from './20261025_164330_leads_credit_apps';
import * as migration_20261025_193658_parts_store from './20261025_193658_parts_store';
import * as migration_20261105_210450_dealer_branding from './20261105_210450_dealer_branding';
import * as migration_20261106_202624_dealer_box from './20261106_202624_dealer_box';
import * as migration_20261106_210200_equipment_carried from './20261106_210200_equipment_carried';
import * as migration_20261106_211840_finance_links from './20261106_211840_finance_links';

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
    name: '20261025_044959_model_config_details',
  },
  {
    up: migration_20261025_164330_leads_credit_apps.up,
    down: migration_20261025_164330_leads_credit_apps.down,
    name: '20261025_164330_leads_credit_apps',
  },
  {
    up: migration_20261025_193658_parts_store.up,
    down: migration_20261025_193658_parts_store.down,
    name: '20261025_193658_parts_store',
  },
  {
    up: migration_20261105_210450_dealer_branding.up,
    down: migration_20261105_210450_dealer_branding.down,
    name: '20261105_210450_dealer_branding',
  },
  {
    up: migration_20261106_202624_dealer_box.up,
    down: migration_20261106_202624_dealer_box.down,
    name: '20261106_202624_dealer_box',
  },
  {
    up: migration_20261106_210200_equipment_carried.up,
    down: migration_20261106_210200_equipment_carried.down,
    name: '20261106_210200_equipment_carried',
  },
  {
    up: migration_20261106_211840_finance_links.up,
    down: migration_20261106_211840_finance_links.down,
    name: '20261106_211840_finance_links'
  },
];
