import { DataSource } from "typeorm";
import { join } from "path";
import { IndexerState } from "./entities/IndexerState";
import { NodeListing } from "./entities/NodeListing";
import { WhitelistRequest } from "./entities/WhitelistRequest";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "thorchain_indexer",
    synchronize: false, // Disable auto-sync in production
    logging: process.env.NODE_ENV === "development",
    migrationsRun: true,
    entities: [IndexerState, NodeListing, WhitelistRequest], // Include all entities
    migrations: [join(__dirname, "migrations/*.{ts,js}")],
    subscribers: [],
}); 