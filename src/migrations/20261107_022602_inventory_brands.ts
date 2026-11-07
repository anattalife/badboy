import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`inventory_details\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`inventory\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`inventory_details_order_idx\` ON \`inventory_details\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`inventory_details_parent_id_idx\` ON \`inventory_details\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`inventory\` ADD \`brand\` text DEFAULT 'badboy' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`inventory_only\` integer DEFAULT false;`)
  // Units listed before the Brand choice existed: no Bad Boy model means another brand.
  await db.run(sql`UPDATE \`inventory\` SET \`brand\` = 'other' WHERE \`model_id\` IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`inventory_details\`;`)
  await db.run(sql`ALTER TABLE \`inventory\` DROP COLUMN \`brand\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`inventory_only\`;`)
}
