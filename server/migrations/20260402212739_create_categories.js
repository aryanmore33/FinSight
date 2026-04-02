exports.up = function (knex) {
  return knex.schema.createTable('categories', (table) => {

    table.uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));

    table.string('name').notNullable();

    table.enu('type', [
      'income',
      'expense'
    ]).notNullable();

    table.timestamps(true, true);

    table.unique(['name','type']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('categories');
};