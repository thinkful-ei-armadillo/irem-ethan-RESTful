const app = require('./app');
const knex = require('knex');
const SETTINGS = require('./config');


const db = knex({
  client: 'pg',
  connection: SETTINGS.DB_URL,
});

app.set('db', db);

app.listen(SETTINGS.PORT, () => {
  console.log(`Server listening at http://localhost:${SETTINGS.PORT}`);
});
