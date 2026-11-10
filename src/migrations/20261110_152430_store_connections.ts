import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`store_settings\` ADD \`stripe_secret_key\` text;`)
  await db.run(sql`ALTER TABLE \`store_settings\` ADD \`stripe_status\` text;`)
  await db.run(sql`ALTER TABLE \`store_settings\` ADD \`stripe_webhook_secret\` text;`)
  await db.run(sql`ALTER TABLE \`store_settings\` ADD \`stripe_webhook_id\` text;`)
  await db.run(sql`ALTER TABLE \`store_settings\` ADD \`stripe_webhook_url\` text;`)
  await db.run(sql`ALTER TABLE \`store_settings\` ADD \`ups_client_id\` text;`)
  await db.run(sql`ALTER TABLE \`store_settings\` ADD \`ups_client_secret\` text;`)
  await db.run(sql`ALTER TABLE \`store_settings\` ADD \`ups_account_number\` text;`)
  await db.run(sql`ALTER TABLE \`store_settings\` ADD \`ups_test_mode\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`store_settings\` ADD \`ups_status\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`store_settings\` DROP COLUMN \`stripe_secret_key\`;`)
  await db.run(sql`ALTER TABLE \`store_settings\` DROP COLUMN \`stripe_status\`;`)
  await db.run(sql`ALTER TABLE \`store_settings\` DROP COLUMN \`stripe_webhook_secret\`;`)
  await db.run(sql`ALTER TABLE \`store_settings\` DROP COLUMN \`stripe_webhook_id\`;`)
  await db.run(sql`ALTER TABLE \`store_settings\` DROP COLUMN \`stripe_webhook_url\`;`)
  await db.run(sql`ALTER TABLE \`store_settings\` DROP COLUMN \`ups_client_id\`;`)
  await db.run(sql`ALTER TABLE \`store_settings\` DROP COLUMN \`ups_client_secret\`;`)
  await db.run(sql`ALTER TABLE \`store_settings\` DROP COLUMN \`ups_account_number\`;`)
  await db.run(sql`ALTER TABLE \`store_settings\` DROP COLUMN \`ups_test_mode\`;`)
  await db.run(sql`ALTER TABLE \`store_settings\` DROP COLUMN \`ups_status\`;`)
}
