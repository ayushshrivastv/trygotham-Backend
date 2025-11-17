import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('censuses', (table) => {
    table.string('id', 32).primary();
    table.string('name', 64).notNullable();
    table.string('description', 256).notNullable();
    table.boolean('enable_location').defaultTo(true);
    table.integer('min_age').defaultTo(0);
    table.boolean('active').defaultTo(true);
    table.string('merkle_root', 64);
    table.string('ipfs_hash', 64);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('active');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('censuses');
}
