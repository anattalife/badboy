// Edited by hand after generation: see the comments in up() and down().
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`offers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`slug\` text,
  	\`kind\` text DEFAULT 'financing',
  	\`starts_at\` text,
  	\`ends_at\` text,
  	\`summary\` text,
  	\`image_id\` integer,
  	\`disclaimer\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`offers_slug_idx\` ON \`offers\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`offers_image_idx\` ON \`offers\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`offers_updated_at_idx\` ON \`offers\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`offers_created_at_idx\` ON \`offers\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`offers__status_idx\` ON \`offers\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`offers_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`models_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`models_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`offers_rels_order_idx\` ON \`offers_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`offers_rels_parent_idx\` ON \`offers_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`offers_rels_path_idx\` ON \`offers_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`offers_rels_models_id_idx\` ON \`offers_rels\` (\`models_id\`);`)
  await db.run(sql`CREATE TABLE \`_offers_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_kind\` text DEFAULT 'financing',
  	\`version_starts_at\` text,
  	\`version_ends_at\` text,
  	\`version_summary\` text,
  	\`version_image_id\` integer,
  	\`version_disclaimer\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_offers_v_parent_idx\` ON \`_offers_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_version_slug_idx\` ON \`_offers_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_version_image_idx\` ON \`_offers_v\` (\`version_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_version_updated_at_idx\` ON \`_offers_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_version_created_at_idx\` ON \`_offers_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_version__status_idx\` ON \`_offers_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_created_at_idx\` ON \`_offers_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_updated_at_idx\` ON \`_offers_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_latest_idx\` ON \`_offers_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_offers_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`models_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_offers_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`models_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_offers_v_rels_order_idx\` ON \`_offers_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_rels_parent_idx\` ON \`_offers_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_rels_path_idx\` ON \`_offers_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_rels_models_id_idx\` ON \`_offers_v_rels\` (\`models_id\`);`)
  // site_settings gets new columns in place: rebuilding it would cascade-delete its hours rows.
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`hero_image_id\` integer REFERENCES media(id) ON DELETE set null;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`finance_email\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`service_email\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`price_display\` text DEFAULT 'dealer' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`show_payment_estimate\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`finance_apr\` numeric DEFAULT 6.99;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`finance_term_months\` numeric DEFAULT 60;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`finance_down_percent\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`finance_disclaimer\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`setup_completed_at\` text;`)
  await db.run(sql`CREATE INDEX \`site_settings_hero_image_idx\` ON \`site_settings\` (\`hero_image_id\`);`)
  // Sites that already have dealership info were set up before the wizard existed.
  await db.run(sql`UPDATE \`site_settings\` SET \`setup_completed_at\` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE \`site_name\` IS NOT NULL AND \`site_name\` <> '';`)
  await db.run(sql`ALTER TABLE \`leads\` ADD \`configuration\` text;`)
  await db.run(sql`ALTER TABLE \`leads\` ADD \`offer_id\` integer REFERENCES offers(id);`)
  await db.run(sql`CREATE INDEX \`leads_offer_idx\` ON \`leads\` (\`offer_id\`);`)
  await db.run(sql`ALTER TABLE \`inventory\` ADD \`price_display\` text DEFAULT 'default';`)
  await db.run(sql`ALTER TABLE \`models\` ADD \`price_display\` text DEFAULT 'default';`)
  await db.run(sql`ALTER TABLE \`_models_v\` ADD \`version_price_display\` text DEFAULT 'default';`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`offers_id\` integer REFERENCES offers(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_offers_id_idx\` ON \`payload_locked_documents_rels\` (\`offers_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Columns with foreign keys (site_settings.hero_image_id, leads.offer_id,
  // payload_locked_documents_rels.offers_id) stay: SQLite can't drop them. They're unused after rollback.
  await db.run(sql`DROP INDEX IF EXISTS \`site_settings_hero_image_idx\`;`)
  for (const column of ['finance_email', 'service_email', 'price_display', 'show_payment_estimate', 'finance_apr', 'finance_term_months', 'finance_down_percent', 'finance_disclaimer', 'setup_completed_at']) {
    await db.run(sql.raw(`ALTER TABLE \`site_settings\` DROP COLUMN \`${column}\`;`))
  }
  await db.run(sql`ALTER TABLE \`leads\` DROP COLUMN \`configuration\`;`)
  await db.run(sql`ALTER TABLE \`inventory\` DROP COLUMN \`price_display\`;`)
  await db.run(sql`ALTER TABLE \`models\` DROP COLUMN \`price_display\`;`)
  await db.run(sql`ALTER TABLE \`_models_v\` DROP COLUMN \`version_price_display\`;`)
  await db.run(sql`DROP TABLE \`_offers_v_rels\`;`)
  await db.run(sql`DROP TABLE \`_offers_v\`;`)
  await db.run(sql`DROP TABLE \`offers_rels\`;`)
}
