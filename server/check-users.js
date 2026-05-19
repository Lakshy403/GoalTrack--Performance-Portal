import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { query } from './config/database.js';

async function checkUsers() {
  try {
    const [users] = await query("SELECT id, email, role, manager_id FROM users;");
    console.table(users);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkUsers();
