import knex from 'knex';

const connector = knex({
  client: 'mysql2',
  debug: true,
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: 'secret',
    database: 'coolaid_test',
  },
});

export default connector;
