import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIndexerState1709250000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "indexer_state" (
                "id" SERIAL NOT NULL,
                "address" character varying NOT NULL,
                "last_block" integer NOT NULL,
                "last_updated" TIMESTAMP NOT NULL,
                CONSTRAINT "PK_indexer_state" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_indexer_state_address" UNIQUE ("address")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "indexer_state"`);
    }
} 