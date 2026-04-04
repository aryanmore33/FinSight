exports.seed = async function(knex) {
  await knex('roles').del();

  await knex('roles').insert([
    { id: 1, name: 'viewer', description: 'Can only view dashboard' },
    { id: 2, name: 'analyst', description: 'Can view records and insights' },
    { id: 3, name: 'admin', description: 'Full access' }
  ]);
};