import { DataSource } from "typeorm";
import { commonDatasourceConfig } from "./data-source";

export const AppDataSourceApi = new DataSource({
    ...commonDatasourceConfig
}); 