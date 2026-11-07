import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`url\` text,
  	\`style\` text DEFAULT 'primary',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_hero\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_buttons_order_idx\` ON \`pages_blocks_hero_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_buttons_parent_id_idx\` ON \`pages_blocks_hero_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text DEFAULT 'Authorized Bad Boy dealer',
  	\`heading\` text DEFAULT 'Bad Boy equipment for {region}',
  	\`text\` text,
  	\`image_id\` integer,
  	\`show_mountains\` integer DEFAULT false,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_image_idx\` ON \`pages_blocks_hero\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`body\` text,
  	\`width\` text DEFAULT 'narrow',
  	\`background\` text DEFAULT 'none',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_order_idx\` ON \`pages_blocks_content\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_parent_id_idx\` ON \`pages_blocks_content\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_path_idx\` ON \`pages_blocks_content\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_media_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`image_position\` text DEFAULT 'left',
  	\`heading\` text,
  	\`body\` text,
  	\`button_label\` text,
  	\`button_url\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_text_order_idx\` ON \`pages_blocks_media_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_text_parent_id_idx\` ON \`pages_blocks_media_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_text_path_idx\` ON \`pages_blocks_media_text\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_media_text_image_idx\` ON \`pages_blocks_media_text\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_category_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'The full Bad Boy line',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_category_grid_order_idx\` ON \`pages_blocks_category_grid\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_category_grid_parent_id_idx\` ON \`pages_blocks_category_grid\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_category_grid_path_idx\` ON \`pages_blocks_category_grid\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_featured_models\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Popular with our customers',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_featured_models_order_idx\` ON \`pages_blocks_featured_models\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_featured_models_parent_id_idx\` ON \`pages_blocks_featured_models\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_featured_models_path_idx\` ON \`pages_blocks_featured_models\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_offers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Current offers',
  	\`limit\` numeric DEFAULT 3,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_offers_order_idx\` ON \`pages_blocks_offers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_offers_parent_id_idx\` ON \`pages_blocks_offers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_offers_path_idx\` ON \`pages_blocks_offers\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_in_stock\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'On the lot now',
  	\`limit\` numeric DEFAULT 3,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_in_stock_order_idx\` ON \`pages_blocks_in_stock\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_in_stock_parent_id_idx\` ON \`pages_blocks_in_stock\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_in_stock_path_idx\` ON \`pages_blocks_in_stock\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_acreage_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`advice\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_acreage\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_acreage_options_order_idx\` ON \`pages_blocks_acreage_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_acreage_options_parent_id_idx\` ON \`pages_blocks_acreage_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_acreage\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'How much ground are you covering?',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_acreage_order_idx\` ON \`pages_blocks_acreage\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_acreage_parent_id_idx\` ON \`pages_blocks_acreage\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_acreage_path_idx\` ON \`pages_blocks_acreage\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_call_to_action\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`text\` text,
  	\`button_label\` text,
  	\`button_url\` text,
  	\`color\` text DEFAULT 'accent',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_call_to_action_order_idx\` ON \`pages_blocks_call_to_action\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_call_to_action_parent_id_idx\` ON \`pages_blocks_call_to_action\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_call_to_action_path_idx\` ON \`pages_blocks_call_to_action\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_features_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	\`link_label\` text,
  	\`link_url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_features\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_features_items_order_idx\` ON \`pages_blocks_features_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_features_items_parent_id_idx\` ON \`pages_blocks_features_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`intro\` text,
  	\`background\` text DEFAULT 'panel',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_features_order_idx\` ON \`pages_blocks_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_features_parent_id_idx\` ON \`pages_blocks_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_features_path_idx\` ON \`pages_blocks_features\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_faq_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_faq\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_items_order_idx\` ON \`pages_blocks_faq_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_items_parent_id_idx\` ON \`pages_blocks_faq_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Common questions',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_order_idx\` ON \`pages_blocks_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_parent_id_idx\` ON \`pages_blocks_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_path_idx\` ON \`pages_blocks_faq\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_visit\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Come see it in person',
  	\`text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_visit_order_idx\` ON \`pages_blocks_visit\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_visit_parent_id_idx\` ON \`pages_blocks_visit\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_visit_path_idx\` ON \`pages_blocks_visit\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_lead_form\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Send us a message',
  	\`intro\` text,
  	\`form_type\` text DEFAULT 'contact',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_lead_form_order_idx\` ON \`pages_blocks_lead_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_lead_form_parent_id_idx\` ON \`pages_blocks_lead_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_lead_form_path_idx\` ON \`pages_blocks_lead_form\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`slug\` text,
  	\`intro\` text,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`pages__status_idx\` ON \`pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`models_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`models_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_models_id_idx\` ON \`pages_rels\` (\`models_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`url\` text,
  	\`style\` text DEFAULT 'primary',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_hero\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_buttons_order_idx\` ON \`_pages_v_blocks_hero_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_buttons_parent_id_idx\` ON \`_pages_v_blocks_hero_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text DEFAULT 'Authorized Bad Boy dealer',
  	\`heading\` text DEFAULT 'Bad Boy equipment for {region}',
  	\`text\` text,
  	\`image_id\` integer,
  	\`show_mountains\` integer DEFAULT false,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_order_idx\` ON \`_pages_v_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_parent_id_idx\` ON \`_pages_v_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_path_idx\` ON \`_pages_v_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_image_idx\` ON \`_pages_v_blocks_hero\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`body\` text,
  	\`width\` text DEFAULT 'narrow',
  	\`background\` text DEFAULT 'none',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_order_idx\` ON \`_pages_v_blocks_content\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_parent_id_idx\` ON \`_pages_v_blocks_content\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_path_idx\` ON \`_pages_v_blocks_content\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_media_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`image_position\` text DEFAULT 'left',
  	\`heading\` text,
  	\`body\` text,
  	\`button_label\` text,
  	\`button_url\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_text_order_idx\` ON \`_pages_v_blocks_media_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_text_parent_id_idx\` ON \`_pages_v_blocks_media_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_text_path_idx\` ON \`_pages_v_blocks_media_text\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_media_text_image_idx\` ON \`_pages_v_blocks_media_text\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_category_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'The full Bad Boy line',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_category_grid_order_idx\` ON \`_pages_v_blocks_category_grid\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_category_grid_parent_id_idx\` ON \`_pages_v_blocks_category_grid\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_category_grid_path_idx\` ON \`_pages_v_blocks_category_grid\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_featured_models\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Popular with our customers',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_featured_models_order_idx\` ON \`_pages_v_blocks_featured_models\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_featured_models_parent_id_idx\` ON \`_pages_v_blocks_featured_models\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_featured_models_path_idx\` ON \`_pages_v_blocks_featured_models\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_offers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Current offers',
  	\`limit\` numeric DEFAULT 3,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_offers_order_idx\` ON \`_pages_v_blocks_offers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_offers_parent_id_idx\` ON \`_pages_v_blocks_offers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_offers_path_idx\` ON \`_pages_v_blocks_offers\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_in_stock\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'On the lot now',
  	\`limit\` numeric DEFAULT 3,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_in_stock_order_idx\` ON \`_pages_v_blocks_in_stock\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_in_stock_parent_id_idx\` ON \`_pages_v_blocks_in_stock\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_in_stock_path_idx\` ON \`_pages_v_blocks_in_stock\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_acreage_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`advice\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_acreage\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_acreage_options_order_idx\` ON \`_pages_v_blocks_acreage_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_acreage_options_parent_id_idx\` ON \`_pages_v_blocks_acreage_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_acreage\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'How much ground are you covering?',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_acreage_order_idx\` ON \`_pages_v_blocks_acreage\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_acreage_parent_id_idx\` ON \`_pages_v_blocks_acreage\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_acreage_path_idx\` ON \`_pages_v_blocks_acreage\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_call_to_action\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`text\` text,
  	\`button_label\` text,
  	\`button_url\` text,
  	\`color\` text DEFAULT 'accent',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_call_to_action_order_idx\` ON \`_pages_v_blocks_call_to_action\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_call_to_action_parent_id_idx\` ON \`_pages_v_blocks_call_to_action\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_call_to_action_path_idx\` ON \`_pages_v_blocks_call_to_action\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_features_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	\`link_label\` text,
  	\`link_url\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_features\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_features_items_order_idx\` ON \`_pages_v_blocks_features_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_features_items_parent_id_idx\` ON \`_pages_v_blocks_features_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`intro\` text,
  	\`background\` text DEFAULT 'panel',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_features_order_idx\` ON \`_pages_v_blocks_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_features_parent_id_idx\` ON \`_pages_v_blocks_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_features_path_idx\` ON \`_pages_v_blocks_features\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_faq_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_faq\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_items_order_idx\` ON \`_pages_v_blocks_faq_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_items_parent_id_idx\` ON \`_pages_v_blocks_faq_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Common questions',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_order_idx\` ON \`_pages_v_blocks_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_parent_id_idx\` ON \`_pages_v_blocks_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_path_idx\` ON \`_pages_v_blocks_faq\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_visit\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Come see it in person',
  	\`text\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_visit_order_idx\` ON \`_pages_v_blocks_visit\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_visit_parent_id_idx\` ON \`_pages_v_blocks_visit\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_visit_path_idx\` ON \`_pages_v_blocks_visit\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_lead_form\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Send us a message',
  	\`intro\` text,
  	\`form_type\` text DEFAULT 'contact',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_lead_form_order_idx\` ON \`_pages_v_blocks_lead_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_lead_form_parent_id_idx\` ON \`_pages_v_blocks_lead_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_lead_form_path_idx\` ON \`_pages_v_blocks_lead_form\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_intro\` text,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version__status_idx\` ON \`_pages_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_latest_idx\` ON \`_pages_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_autosave_idx\` ON \`_pages_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`models_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`models_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_order_idx\` ON \`_pages_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_parent_idx\` ON \`_pages_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_path_idx\` ON \`_pages_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_models_id_idx\` ON \`_pages_v_rels\` (\`models_id\`);`)
  await db.run(sql`CREATE TABLE \`navigation_main_menu\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`navigation_main_menu_order_idx\` ON \`navigation_main_menu\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`navigation_main_menu_parent_id_idx\` ON \`navigation_main_menu\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`navigation_footer_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`navigation_footer_links_order_idx\` ON \`navigation_footer_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`navigation_footer_links_parent_id_idx\` ON \`navigation_footer_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`navigation\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`footer_text\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`pages_id\` integer REFERENCES pages(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_hero_buttons\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_content\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_media_text\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_category_grid\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_featured_models\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_offers\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_in_stock\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_acreage_options\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_acreage\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_call_to_action\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_features_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_features\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_faq_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_faq\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_visit\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_lead_form\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`pages_rels\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_buttons\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_media_text\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_category_grid\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_featured_models\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_offers\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_in_stock\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_acreage_options\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_acreage\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_call_to_action\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_features_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_features\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_faq_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_faq\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_visit\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_lead_form\`;`)
  await db.run(sql`DROP TABLE \`_pages_v\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_rels\`;`)
  await db.run(sql`DROP TABLE \`navigation_main_menu\`;`)
  await db.run(sql`DROP TABLE \`navigation_footer_links\`;`)
  await db.run(sql`DROP TABLE \`navigation\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`leads_id\` integer,
  	\`credit_applications_id\` integer,
  	\`orders_id\` integer,
  	\`inventory_id\` integer,
  	\`models_id\` integer,
  	\`offers_id\` integer,
  	\`categories_id\` integer,
  	\`parts_id\` integer,
  	\`part_imports_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	\`audit_log_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`leads_id\`) REFERENCES \`leads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`credit_applications_id\`) REFERENCES \`credit_applications\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`orders_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`inventory_id\`) REFERENCES \`inventory\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`models_id\`) REFERENCES \`models\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`offers_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`parts_id\`) REFERENCES \`parts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`part_imports_id\`) REFERENCES \`part_imports\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`audit_log_id\`) REFERENCES \`audit_log\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "leads_id", "credit_applications_id", "orders_id", "inventory_id", "models_id", "offers_id", "categories_id", "parts_id", "part_imports_id", "media_id", "users_id", "audit_log_id") SELECT "id", "order", "parent_id", "path", "leads_id", "credit_applications_id", "orders_id", "inventory_id", "models_id", "offers_id", "categories_id", "parts_id", "part_imports_id", "media_id", "users_id", "audit_log_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`leads_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_credit_applications_id_idx\` ON \`payload_locked_documents_rels\` (\`credit_applications_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_inventory_id_idx\` ON \`payload_locked_documents_rels\` (\`inventory_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_models_id_idx\` ON \`payload_locked_documents_rels\` (\`models_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_offers_id_idx\` ON \`payload_locked_documents_rels\` (\`offers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parts_id_idx\` ON \`payload_locked_documents_rels\` (\`parts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_part_imports_id_idx\` ON \`payload_locked_documents_rels\` (\`part_imports_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_audit_log_id_idx\` ON \`payload_locked_documents_rels\` (\`audit_log_id\`);`)
}
