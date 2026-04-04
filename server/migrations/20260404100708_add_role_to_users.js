exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table
      .integer('role_id')
      .unsigned()
      .references('id')
      .inTable('roles')
      .onDelete('SET NULL')
      .defaultTo(1);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('role_id');
  });
};