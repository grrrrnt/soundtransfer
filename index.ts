import dotenv from 'dotenv';
import { listen } from './web/express';
import { connectDB } from './lib/mongo';

dotenv.config();

async function main() {
  await connectDB();
  await listen();
}

main()
  .catch(console.error)
