import { DataSource } from 'typeorm';
import * as path from 'path';

const src = path.join(process.cwd(), 'src');

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [path.join(src, 'database', 'entities', '**', '*.entity.{ts,js}')],
  migrations: [path.join(src, 'database', 'migrations', '**', '*.{ts,js}')],
  synchronize: false,
});
