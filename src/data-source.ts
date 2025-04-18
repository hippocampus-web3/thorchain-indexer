import { DataSource, DataSourceOptions } from "typeorm";
import { join } from "path";

export const commonDatasourceConfig: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "thorchain_indexer",
    synchronize: false, // Disable auto-sync in production
    logging: process.env.NODE_ENV === "development",
    entities: [join(__dirname, "entities/*.{ts,js}")],
    migrations: [join(__dirname, "migrations/*.{ts,js}")],
    subscribers: [],
}

export const AppDataSource = new DataSource({
    ...commonDatasourceConfig,
    migrationsRun: true,
});

