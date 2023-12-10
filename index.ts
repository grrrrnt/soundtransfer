import dotenv from 'dotenv';
import { listen, port } from './web/express';
import { connectDB } from './lib/mongo';

dotenv.config();

async function main() {
  await connectDB();
  await listen();
  console.log(`Please visit http://localhost:${port}`);
}

main()
  .catch(console.error)
