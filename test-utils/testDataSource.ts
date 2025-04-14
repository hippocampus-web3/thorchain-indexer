import { join } from 'path';
import { DataSource } from 'typeorm';

export const testDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5433"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "thorchain_indexer_tests",
  entities: [__dirname + '/../src/entities/**/*.ts'],
  migrations: [join(__dirname, "/../src/migrations/*.{ts,js}")],
  dropSchema: true,
});
