exports.up = function (knex) {
  return knex.schema.createTable('categories', (table) => {

    table.uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.string('name').notNullable();

    table.enu('type', [
      'income',
      'expense'
    ]).notNullable();

    table.string('color');
    table.string('icon');

    table.boolean('is_deleted').defaultTo(false);

    table.timestamps(true, true);

    table.unique(['user_id', 'name', 'type']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('categories');
};