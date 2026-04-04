exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.boolean('is_approved').defaultTo(true);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('is_approved');
  });
};
