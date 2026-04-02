exports.up = function (knex) {
  return knex.schema.createTable('financial_records', (table) => {

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
      .onDelete('SET NULL');

    table.decimal('amount', 12, 2)
      .notNullable();

    table.enu('type', [
      'income',
      'expense'
    ]).notNullable();

    table.date('transaction_date')
      .notNullable();

    table.text('notes');

    table.boolean('is_deleted')
      .defaultTo(false);

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('financial_records');
};