import knex from 'knex';

const connector = knex({
  client: 'mysql',
});

export default connector;
