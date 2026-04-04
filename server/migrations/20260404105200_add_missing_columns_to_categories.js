exports.up = function (knex) {
  return knex.schema.alterTable('categories', (table) => {
    table.string('color');
    table.string('icon');
    table.boolean('is_deleted').defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('categories', (table) => {
    table.dropColumn('color');
    table.dropColumn('icon');
    table.dropColumn('is_deleted');
  });
};