import knexObj from "knex";
const knex = knexObj({
  client: "mysql2",
  connection: {
    host: "localhost",
    port: 33061,
    user: "root",
    password: "root",
    database: "e_paper",
  },
  pool: { min: 0, max: 7 },
});
export default knex;
