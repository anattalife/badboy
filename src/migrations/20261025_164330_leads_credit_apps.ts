import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`leads_staff_notes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`note\` text NOT NULL,
  	\`author_id\` integer,
  	\`at\` text,
  	FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`leads\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`leads_staff_notes_order_idx\` ON \`leads_staff_notes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`leads_staff_notes_parent_id_idx\` ON \`leads_staff_notes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`leads_staff_notes_author_idx\` ON \`leads_staff_notes\` (\`author_id\`);`)
  await db.run(sql`CREATE TABLE \`leads\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`type\` text NOT NULL,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`assigned_to_id\` integer,
  	\`summary\` text,
  	\`name\` text NOT NULL,
  	\`email\` text,
  	\`phone\` text,
  	\`preferred_contact\` text,
  	\`zip\` text,
  	\`timeframe\` text,
  	\`message\` text,
  	\`model_id\` integer,
  	\`unit_id\` integer,
  	\`trade_in_year\` numeric,
  	\`trade_in_make\` text,
  	\`trade_in_model\` text,
  	\`trade_in_hours\` numeric,
  	\`trade_in_condition\` text,
  	\`trade_in_details\` text,
  	\`source_page\` text,
  	\`source_ip\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`assigned_to_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`model_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`unit_id\`) REFERENCES \`inventory\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`leads_status_idx\` ON \`leads\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`leads_assigned_to_idx\` ON \`leads\` (\`assigned_to_id\`);`)
  await db.run(sql`CREATE INDEX \`leads_model_idx\` ON \`leads\` (\`model_id\`);`)
  await db.run(sql`CREATE INDEX \`leads_unit_idx\` ON \`leads\` (\`unit_id\`);`)
  await db.run(sql`CREATE INDEX \`leads_updated_at_idx\` ON \`leads\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`leads_created_at_idx\` ON \`leads\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`credit_applications_co_applicant\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`first_name\` text,
  	\`middle_initial\` text,
  	\`last_name\` text,
  	\`email\` text,
  	\`phone\` text,
  	\`ssn\` text,
  	\`date_of_birth\` text,
  	\`address_street\` text,
  	\`address_city\` text,
  	\`address_state\` text,
  	\`address_zip\` text,
  	\`address_years_at_address\` numeric,
  	\`address_months_at_address\` numeric,
  	\`address_housing\` text,
  	\`address_monthly_housing_payment\` numeric,
  	\`employment_status\` text,
  	\`employment_employer\` text,
  	\`employment_job_title\` text,
  	\`employment_employer_phone\` text,
  	\`employment_years_employed\` numeric,
  	\`employment_months_employed\` numeric,
  	\`monthly_income\` text,
  	\`other_monthly_income\` text,
  	\`other_income_source\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`credit_applications\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`credit_applications_co_applicant_order_idx\` ON \`credit_applications_co_applicant\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`credit_applications_co_applicant_parent_id_idx\` ON \`credit_applications_co_applicant\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`credit_applications_staff_notes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`note\` text NOT NULL,
  	\`author_id\` integer,
  	\`at\` text,
  	FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`credit_applications\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`credit_applications_staff_notes_order_idx\` ON \`credit_applications_staff_notes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`credit_applications_staff_notes_parent_id_idx\` ON \`credit_applications_staff_notes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`credit_applications_staff_notes_author_idx\` ON \`credit_applications_staff_notes\` (\`author_id\`);`)
  await db.run(sql`CREATE TABLE \`credit_applications\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`lender\` text,
  	\`assigned_to_id\` integer,
  	\`summary\` text,
  	\`model_id\` integer,
  	\`unit_id\` integer,
  	\`equipment_description\` text,
  	\`purchase_price\` numeric,
  	\`down_payment\` numeric,
  	\`amount_requested\` numeric,
  	\`applicant_first_name\` text NOT NULL,
  	\`applicant_middle_initial\` text,
  	\`applicant_last_name\` text NOT NULL,
  	\`applicant_email\` text,
  	\`applicant_phone\` text,
  	\`applicant_ssn\` text,
  	\`applicant_date_of_birth\` text,
  	\`applicant_address_street\` text,
  	\`applicant_address_city\` text,
  	\`applicant_address_state\` text,
  	\`applicant_address_zip\` text,
  	\`applicant_address_years_at_address\` numeric,
  	\`applicant_address_months_at_address\` numeric,
  	\`applicant_address_housing\` text,
  	\`applicant_address_monthly_housing_payment\` numeric,
  	\`applicant_employment_status\` text,
  	\`applicant_employment_employer\` text,
  	\`applicant_employment_job_title\` text,
  	\`applicant_employment_employer_phone\` text,
  	\`applicant_employment_years_employed\` numeric,
  	\`applicant_employment_months_employed\` numeric,
  	\`applicant_monthly_income\` text,
  	\`applicant_other_monthly_income\` text,
  	\`applicant_other_income_source\` text,
  	\`consent_agreed_at\` text,
  	\`consent_text\` text,
  	\`consent_ip\` text,
  	\`consent_user_agent\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`assigned_to_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`model_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`unit_id\`) REFERENCES \`inventory\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`credit_applications_status_idx\` ON \`credit_applications\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`credit_applications_assigned_to_idx\` ON \`credit_applications\` (\`assigned_to_id\`);`)
  await db.run(sql`CREATE INDEX \`credit_applications_model_idx\` ON \`credit_applications\` (\`model_id\`);`)
  await db.run(sql`CREATE INDEX \`credit_applications_unit_idx\` ON \`credit_applications\` (\`unit_id\`);`)
  await db.run(sql`CREATE INDEX \`credit_applications_updated_at_idx\` ON \`credit_applications\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`credit_applications_created_at_idx\` ON \`credit_applications\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`audit_log\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`summary\` text NOT NULL,
  	\`action\` text NOT NULL,
  	\`collection_slug\` text NOT NULL,
  	\`doc_id\` text,
  	\`user_id\` integer,
  	\`ip\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`audit_log_user_idx\` ON \`audit_log\` (\`user_id\`);`)
  await db.run(sql`CREATE INDEX \`audit_log_updated_at_idx\` ON \`audit_log\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`audit_log_created_at_idx\` ON \`audit_log\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`leads_id\` integer REFERENCES leads(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`credit_applications_id\` integer REFERENCES credit_applications(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`audit_log_id\` integer REFERENCES audit_log(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`leads_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_credit_applications_id_idx\` ON \`payload_locked_documents_rels\` (\`credit_applications_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_audit_log_id_idx\` ON \`payload_locked_documents_rels\` (\`audit_log_id\`);`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`credit_application_retention_days\` numeric DEFAULT 365 NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`leads_staff_notes\`;`)
  await db.run(sql`DROP TABLE \`leads\`;`)
  await db.run(sql`DROP TABLE \`credit_applications_co_applicant\`;`)
  await db.run(sql`DROP TABLE \`credit_applications_staff_notes\`;`)
  await db.run(sql`DROP TABLE \`credit_applications\`;`)
  await db.run(sql`DROP TABLE \`audit_log\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`inventory_id\` integer,
  	\`models_id\` integer,
  	\`categories_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`inventory_id\`) REFERENCES \`inventory\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`models_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "inventory_id", "models_id", "categories_id", "media_id", "users_id") SELECT "id", "order", "parent_id", "path", "inventory_id", "models_id", "categories_id", "media_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_inventory_id_idx\` ON \`payload_locked_documents_rels\` (\`inventory_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_models_id_idx\` ON \`payload_locked_documents_rels\` (\`models_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`credit_application_retention_days\`;`)
}
