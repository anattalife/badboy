import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`inventory\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`stock_number\` text NOT NULL,
  	\`condition\` text DEFAULT 'new' NOT NULL,
  	\`status\` text DEFAULT 'available' NOT NULL,
  	\`model_id\` integer,
  	\`year\` numeric NOT NULL,
  	\`hours\` numeric,
  	\`make\` text DEFAULT 'Bad Boy',
  	\`other_model_name\` text,
  	\`category_id\` integer,
  	\`configuration\` text,
  	\`deck\` text,
  	\`engine\` text,
  	\`price\` numeric,
  	\`msrp\` numeric,
  	\`serial_number\` text,
  	\`description\` text,
  	\`featured\` integer DEFAULT false,
  	\`title\` text,
  	\`slug\` text,
  	\`deck_inches\` numeric,
  	\`sold_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`model_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`inventory_stock_number_idx\` ON \`inventory\` (\`stock_number\`);`)
  await db.run(sql`CREATE INDEX \`inventory_status_idx\` ON \`inventory\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`inventory_model_idx\` ON \`inventory\` (\`model_id\`);`)
  await db.run(sql`CREATE INDEX \`inventory_category_idx\` ON \`inventory\` (\`category_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`inventory_slug_idx\` ON \`inventory\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`inventory_deck_inches_idx\` ON \`inventory\` (\`deck_inches\`);`)
  await db.run(sql`CREATE INDEX \`inventory_updated_at_idx\` ON \`inventory\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`inventory_created_at_idx\` ON \`inventory\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`inventory_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`inventory\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`inventory_rels_order_idx\` ON \`inventory_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`inventory_rels_parent_idx\` ON \`inventory_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`inventory_rels_path_idx\` ON \`inventory_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`inventory_rels_media_id_idx\` ON \`inventory_rels\` (\`media_id\`);`)
  await db.run(sql`ALTER TABLE \`models_configurations\` ADD \`discharge\` text;`)
  await db.run(sql`ALTER TABLE \`models_configurations\` ADD \`model_number\` text;`)
  await db.run(sql`ALTER TABLE \`models\` ADD \`msrp\` numeric;`)
  await db.run(sql`ALTER TABLE \`_models_v_version_configurations\` ADD \`discharge\` text;`)
  await db.run(sql`ALTER TABLE \`_models_v_version_configurations\` ADD \`model_number\` text;`)
  await db.run(sql`ALTER TABLE \`_models_v\` ADD \`version_msrp\` numeric;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`inventory_id\` integer REFERENCES inventory(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_inventory_id_idx\` ON \`payload_locked_documents_rels\` (\`inventory_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`inventory\`;`)
  await db.run(sql`DROP TABLE \`inventory_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`models_id\` integer,
  	\`categories_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`models_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "models_id", "categories_id", "media_id", "users_id") SELECT "id", "order", "parent_id", "path", "models_id", "categories_id", "media_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_models_id_idx\` ON \`payload_locked_documents_rels\` (\`models_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`ALTER TABLE \`models_configurations\` DROP COLUMN \`discharge\`;`)
  await db.run(sql`ALTER TABLE \`models_configurations\` DROP COLUMN \`model_number\`;`)
  await db.run(sql`ALTER TABLE \`models\` DROP COLUMN \`msrp\`;`)
  await db.run(sql`ALTER TABLE \`_models_v_version_configurations\` DROP COLUMN \`discharge\`;`)
  await db.run(sql`ALTER TABLE \`_models_v_version_configurations\` DROP COLUMN \`model_number\`;`)
  await db.run(sql`ALTER TABLE \`_models_v\` DROP COLUMN \`version_msrp\`;`)
}
