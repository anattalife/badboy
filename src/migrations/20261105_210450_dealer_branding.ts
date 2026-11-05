import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

// Written by hand: the generated version copied columns that don't exist yet and dropped tables
// that other tables reference with ON DELETE CASCADE.
//
// - site_settings gains the branding columns.
// - store_settings is rebuilt without the Roanoke ship-from and Virginia tax defaults, so a new
//   dealer's store starts blank. Existing values are kept. UPS service choices are saved and
//   restored around the rebuild because dropping the table cascades to them.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`site_url\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`logo_id\` integer REFERENCES media(id) ON DELETE set null;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`brand_color\` text DEFAULT '#2f4a5c';`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`accent_color\` text DEFAULT '#e8641b';`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`region_name\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`hero_text\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`show_mountains\` integer DEFAULT false;`)
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`)

  await db.run(sql`CREATE TABLE \`__ups_services_backup\` AS SELECT * FROM \`store_settings_ups_services\`;`)
  await db.run(sql`CREATE TABLE \`__new_store_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`store_open\` integer DEFAULT true,
  	\`order_email\` text,
  	\`handling_fee\` numeric DEFAULT 0,
  	\`free_shipping_over\` numeric,
  	\`ship_from_name\` text,
  	\`ship_from_phone\` text,
  	\`ship_from_street\` text,
  	\`ship_from_city\` text,
  	\`ship_from_state\` text,
  	\`ship_from_zip\` text,
  	\`default_box_length\` numeric DEFAULT 12,
  	\`default_box_width\` numeric DEFAULT 10,
  	\`default_box_height\` numeric DEFAULT 8,
  	\`tax_enabled\` integer DEFAULT false,
  	\`tax_state\` text,
  	\`tax_rate_percent\` numeric,
  	\`tax_shipping\` integer DEFAULT false,
  	\`updated_at\` text,
  	\`created_at\` text
  );`)
  await db.run(sql`INSERT INTO \`__new_store_settings\` SELECT "id", "store_open", "order_email", "handling_fee", "free_shipping_over", "ship_from_name", "ship_from_phone", "ship_from_street", "ship_from_city", "ship_from_state", "ship_from_zip", "default_box_length", "default_box_width", "default_box_height", "tax_enabled", "tax_state", "tax_rate_percent", "tax_shipping", "updated_at", "created_at" FROM \`store_settings\`;`)
  await db.run(sql`DROP TABLE \`store_settings\`;`)
  await db.run(sql`ALTER TABLE \`__new_store_settings\` RENAME TO \`store_settings\`;`)
  await db.run(sql`INSERT OR IGNORE INTO \`store_settings_ups_services\` SELECT * FROM \`__ups_services_backup\`;`)
  await db.run(sql`DROP TABLE \`__ups_services_backup\`;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // logo_id stays: SQLite can't drop a column that has a foreign key. It's unused after rollback.
  await db.run(sql`DROP INDEX IF EXISTS \`site_settings_logo_idx\`;`)
  for (const column of ['site_url', 'brand_color', 'accent_color', 'region_name', 'hero_text', 'show_mountains']) {
    await db.run(sql.raw(`ALTER TABLE \`site_settings\` DROP COLUMN \`${column}\`;`))
  }
}
