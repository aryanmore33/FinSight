exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));

    table.string('name', 100);

    table.string('email', 150).unique();
    table.string('phone', 15).unique();

    // optional password login
    table.text('password_hash');

    table.boolean('is_email_verified')
      .defaultTo(false);

    table.boolean('is_phone_verified')
      .defaultTo(false);

    table.boolean('two_factor_enabled')
      .defaultTo(false);

    table.boolean('is_active')
      .defaultTo(true);

    table.timestamp('last_login_at');

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users');
};