exports.up = function (knex) {
  return knex.schema.createTable('budgets', (table) => {

    table.uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.uuid('category_id')
      .references('id')
      .inTable('categories')
      .onDelete('CASCADE');

    table.decimal('limit_amount', 12, 2)
      .notNullable();

    table.enu('period', [
      'monthly',
      'weekly'
    ]).defaultTo('monthly');

    table.date('start_date');

    table.timestamps(true, true);

    table.unique([
      'user_id',
      'category_id',
      'period'
    ]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('budgets');
};