exports.up = function (knex) {
  return knex.schema.createTable('otp_verifications', (table) => {

    table.uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));

    table.string('email');
    table.string('phone');

    table.string('otp_code').notNullable();

    table.enu('purpose', [
      'login',
      'register',
      '2fa'
    ]);

    table.timestamp('expires_at').notNullable();

    table.boolean('is_used')
      .defaultTo(false);

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('otp_verifications');
};