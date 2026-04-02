require("dotenv").config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: "pg",
    connection: {
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      port: Number(process.env.PGPORT),
      ssl: true
    },

    pool: {
      min: 0,
      max: 10
    },

    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations"
    },

    seeds: {
      directory: "./seeds"
    }
  }

};