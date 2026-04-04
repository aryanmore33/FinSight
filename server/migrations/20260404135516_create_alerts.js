/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('alerts', (table) => {
 
    table.uuid('id')
      .primary()
      .defaultTo(knex.raw('gen_random_uuid()'));
 
    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();
 
    // Optional: alerts don't always belong to a budget
    table.uuid('budget_id')
      .references('id')
      .inTable('budgets')
      .onDelete('SET NULL')
      .nullable();
 
    // VARCHAR instead of ENUM for flexibility
    table.string('type', 50).notNullable();
    // Supported types: 'exceeded', 'warning', 'reset', 'unusual_spending', 
    // 'high_transaction', 'monthly_summary', 'suspicious_activity'
 
    table.string('title').notNullable();
    table.text('message').notNullable();
 
    // Store additional data as JSON
    table.jsonb('alert_data').nullable();
 
    table.boolean('is_read').defaultTo(false);
 
    table.timestamps(true, true);
 
    // Indexes for common queries
    table.index('user_id');
    table.index('type');
    table.index('is_read');
    table.index(['user_id', 'is_read']);
    table.index('budget_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('alerts');
};
