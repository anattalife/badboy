import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`orders_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`part_id\` integer,
  	\`part_number\` text,
  	\`name\` text NOT NULL,
  	\`unit_price\` numeric NOT NULL,
  	\`qty\` numeric NOT NULL,
  	\`line_total\` numeric NOT NULL,
  	FOREIGN KEY (\`part_id\`) REFERENCES \`parts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`orders_items_order_idx\` ON \`orders_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`orders_items_parent_id_idx\` ON \`orders_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`orders_items_part_idx\` ON \`orders_items\` (\`part_id\`);`)
  await db.run(sql`CREATE TABLE \`orders_staff_notes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`note\` text NOT NULL,
  	\`author_id\` integer,
  	FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`orders_staff_notes_order_idx\` ON \`orders_staff_notes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`orders_staff_notes_parent_id_idx\` ON \`orders_staff_notes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`orders_staff_notes_author_idx\` ON \`orders_staff_notes\` (\`author_id\`);`)
  await db.run(sql`CREATE TABLE \`orders\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order_number\` text NOT NULL,
  	\`status\` text DEFAULT 'pending-payment' NOT NULL,
  	\`tracking_number\` text,
  	\`access_token\` text NOT NULL,
  	\`customer_name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`phone\` text,
  	\`ship_to_street\` text NOT NULL,
  	\`ship_to_street2\` text,
  	\`ship_to_city\` text NOT NULL,
  	\`ship_to_state\` text NOT NULL,
  	\`ship_to_zip\` text NOT NULL,
  	\`ship_to_residential\` integer DEFAULT true,
  	\`subtotal\` numeric NOT NULL,
  	\`shipping_amount\` numeric NOT NULL,
  	\`tax_amount\` numeric NOT NULL,
  	\`total\` numeric NOT NULL,
  	\`shipping_service\` text,
  	\`shipping_service_code\` text,
  	\`tax_rate_percent\` numeric,
  	\`payment_provider\` text,
  	\`payment_reference\` text,
  	\`payment_paid_at\` text,
  	\`customer_notes\` text,
  	\`ip\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`orders_order_number_idx\` ON \`orders\` (\`order_number\`);`)
  await db.run(sql`CREATE INDEX \`orders_status_idx\` ON \`orders\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`orders_updated_at_idx\` ON \`orders\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`orders_created_at_idx\` ON \`orders\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`parts_fits\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`parts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`parts_fits_order_idx\` ON \`parts_fits\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`parts_fits_parent_id_idx\` ON \`parts_fits\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`parts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text,
  	\`part_number\` text,
  	\`category\` text DEFAULT 'other' NOT NULL,
  	\`group\` text,
  	\`description\` text,
  	\`price\` numeric,
  	\`msrp\` numeric,
  	\`availability\` text DEFAULT 'in-stock',
  	\`stock_qty\` numeric,
  	\`weight_lb\` numeric,
  	\`length_in\` numeric,
  	\`width_in\` numeric,
  	\`height_in\` numeric,
  	\`active\` integer DEFAULT true,
  	\`source\` text DEFAULT 'manual',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`parts_slug_idx\` ON \`parts\` (\`slug\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`parts_part_number_idx\` ON \`parts\` (\`part_number\`);`)
  await db.run(sql`CREATE INDEX \`parts_updated_at_idx\` ON \`parts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`parts_created_at_idx\` ON \`parts\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`parts_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`models_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`parts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`models_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`parts_rels_order_idx\` ON \`parts_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`parts_rels_parent_idx\` ON \`parts_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`parts_rels_path_idx\` ON \`parts_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`parts_rels_models_id_idx\` ON \`parts_rels\` (\`models_id\`);`)
  await db.run(sql`CREATE INDEX \`parts_rels_media_id_idx\` ON \`parts_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`part_imports\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`created\` numeric,
  	\`updated\` numeric,
  	\`skipped\` numeric,
  	\`columns_found\` text,
  	\`problems\` text,
  	\`imported_by_id\` integer,
  	\`_objectkey\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	FOREIGN KEY (\`imported_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`part_imports_imported_by_idx\` ON \`part_imports\` (\`imported_by_id\`);`)
  await db.run(sql`CREATE INDEX \`part_imports_updated_at_idx\` ON \`part_imports\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`part_imports_created_at_idx\` ON \`part_imports\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`part_imports_filename_idx\` ON \`part_imports\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`store_settings_ups_services\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`store_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`store_settings_ups_services_order_idx\` ON \`store_settings_ups_services\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`store_settings_ups_services_parent_idx\` ON \`store_settings_ups_services\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`store_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`store_open\` integer DEFAULT true,
  	\`order_email\` text,
  	\`handling_fee\` numeric DEFAULT 0,
  	\`free_shipping_over\` numeric,
  	\`ship_from_name\` text DEFAULT 'Roanoke Golf Cars',
  	\`ship_from_phone\` text DEFAULT '5409860098',
  	\`ship_from_street\` text DEFAULT '4802 Melrose Ave NW',
  	\`ship_from_city\` text DEFAULT 'Roanoke',
  	\`ship_from_state\` text DEFAULT 'VA',
  	\`ship_from_zip\` text DEFAULT '24017',
  	\`default_box_length\` numeric DEFAULT 12,
  	\`default_box_width\` numeric DEFAULT 10,
  	\`default_box_height\` numeric DEFAULT 8,
  	\`tax_enabled\` integer DEFAULT true,
  	\`tax_state\` text DEFAULT 'VA',
  	\`tax_rate_percent\` numeric DEFAULT 5.3,
  	\`tax_shipping\` integer DEFAULT false,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`orders_id\` integer REFERENCES orders(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`parts_id\` integer REFERENCES parts(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`part_imports_id\` integer REFERENCES part_imports(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parts_id_idx\` ON \`payload_locked_documents_rels\` (\`parts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_part_imports_id_idx\` ON \`payload_locked_documents_rels\` (\`part_imports_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`orders_items\`;`)
  await db.run(sql`DROP TABLE \`orders_staff_notes\`;`)
  await db.run(sql`DROP TABLE \`orders\`;`)
  await db.run(sql`DROP TABLE \`parts_fits\`;`)
  await db.run(sql`DROP TABLE \`parts\`;`)
  await db.run(sql`DROP TABLE \`parts_rels\`;`)
  await db.run(sql`DROP TABLE \`part_imports\`;`)
  await db.run(sql`DROP TABLE \`store_settings_ups_services\`;`)
  await db.run(sql`DROP TABLE \`store_settings\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`leads_id\` integer,
  	\`credit_applications_id\` integer,
  	\`inventory_id\` integer,
  	\`models_id\` integer,
  	\`categories_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	\`audit_log_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`leads_id\`) REFERENCES \`leads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`credit_applications_id\`) REFERENCES \`credit_applications\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`inventory_id\`) REFERENCES \`inventory\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`models_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`audit_log_id\`) REFERENCES \`audit_log\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "leads_id", "credit_applications_id", "inventory_id", "models_id", "categories_id", "media_id", "users_id", "audit_log_id") SELECT "id", "order", "parent_id", "path", "leads_id", "credit_applications_id", "inventory_id", "models_id", "categories_id", "media_id", "users_id", "audit_log_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`leads_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_credit_applications_id_idx\` ON \`payload_locked_documents_rels\` (\`credit_applications_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_inventory_id_idx\` ON \`payload_locked_documents_rels\` (\`inventory_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_models_id_idx\` ON \`payload_locked_documents_rels\` (\`models_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_audit_log_id_idx\` ON \`payload_locked_documents_rels\` (\`audit_log_id\`);`)
}
