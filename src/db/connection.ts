import { Knex, knex } from 'knex';

export const connect = (): Knex => {
  const config: Knex.Config = {
    client: 'mysql',
    connection: {
      host: process.env.CONNECTION_HOST,
      user: process.env.CONNECTION_USER,
      password: process.env.CONNECTION_PWD,
      database: process.env.CONNECTION_DB,
    },
    pool: { min: 1, max: 1 }
  };

  return knex(config);
};
