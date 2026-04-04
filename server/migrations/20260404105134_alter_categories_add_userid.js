exports.up = async function (knex) {
  await knex.schema.alterTable("categories", (table) => {
    table.uuid("user_id");
  });

  // assign existing rows
  await knex.raw(`
    UPDATE categories 
    SET user_id = (SELECT id FROM users LIMIT 1)
    WHERE user_id IS NULL
  `);

  await knex.schema.alterTable("categories", (table) => {
    table.uuid("user_id").notNullable().alter();
    table.unique(["user_id", "name", "type"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("categories", (table) => {
    table.dropUnique(["user_id", "name", "type"]);
    table.dropColumn("user_id");
  });
};