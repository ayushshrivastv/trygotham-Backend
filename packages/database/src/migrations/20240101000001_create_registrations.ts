import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('registrations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('census_id', 32).notNullable().references('id').inTable('censuses');
    table.string('nullifier_hash', 64).notNullable().unique();
    table.integer('age_range').notNullable();
    table.integer('continent').notNullable();
    table.bigInteger('timestamp').notNullable();
    table.string('transaction_signature', 128).notNullable();
    table.enum('status', ['pending', 'verified', 'rejected']).defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('census_id');
    table.index('nullifier_hash');
    table.index('status');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('registrations');
}
