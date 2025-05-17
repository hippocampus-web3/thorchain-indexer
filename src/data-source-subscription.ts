import { DataSource } from "typeorm"
import { config } from "dotenv"

config()

export const subscriptionDataSource = new DataSource({
    type: "postgres",
    host: process.env.SUBSCRIPTION_DB_HOST || "localhost",
    port: parseInt(process.env.SUBSCRIPTION_DB_PORT || "5434"),
    username: process.env.SUBSCRIPTION_DB_USER || "postgres",
    password: process.env.SUBSCRIPTION_DB_PASSWORD || "postgres",
    database: process.env.SUBSCRIPTION_DB_NAME || "runebond_notifier",
    synchronize: false,
    logging: process.env.NODE_ENV === "development",
    entities: [__dirname + '/subscriptions/entities/*.{ts,js}']
}) 