const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./test.db' });
client.execute('CREATE TABLE IF NOT EXISTS users (id TEXT, name TEXT)')
  .then(() => client.execute('INSERT INTO users VALUES (?, ?)', ['1', 'test']))
  .then(() => client.execute('SELECT * FROM users'))
  .then(r => {
    console.log('rows:', r.rows);
    client.close();
  })
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
