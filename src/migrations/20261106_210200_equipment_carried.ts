import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`models\` ADD \`not_carried\` integer DEFAULT false;`)
  await db.run(sql`CREATE INDEX \`models_not_carried_idx\` ON \`models\` (\`not_carried\`);`)
  await db.run(sql`ALTER TABLE \`_models_v\` ADD \`version_not_carried\` integer DEFAULT false;`)
  await db.run(sql`CREATE INDEX \`_models_v_version_version_not_carried_idx\` ON \`_models_v\` (\`version_not_carried\`);`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`not_carried\` integer DEFAULT false;`)
  await db.run(sql`CREATE INDEX \`categories_not_carried_idx\` ON \`categories\` (\`not_carried\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`models_not_carried_idx\`;`)
  await db.run(sql`ALTER TABLE \`models\` DROP COLUMN \`not_carried\`;`)
  await db.run(sql`DROP INDEX \`_models_v_version_version_not_carried_idx\`;`)
  await db.run(sql`ALTER TABLE \`_models_v\` DROP COLUMN \`version_not_carried\`;`)
  await db.run(sql`DROP INDEX \`categories_not_carried_idx\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`not_carried\`;`)
}
