import knex, { Knex } from 'knex';
import config from '../knexfile';

const environment = process.env.NODE_ENV || 'development';
const knexConfig = config[environment];

export const db: Knex = knex(knexConfig);

// Models
export * from './models/Census';
export * from './models/Registration';
export * from './models/Stats';

// Export database instance
export default db;
