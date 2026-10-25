import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`models_configurations\` ADD \`msrp\` numeric;`)
  await db.run(sql`ALTER TABLE \`_models_v_version_configurations\` ADD \`msrp\` numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`models_configurations\` DROP COLUMN \`msrp\`;`)
  await db.run(sql`ALTER TABLE \`_models_v_version_configurations\` DROP COLUMN \`msrp\`;`)
}
