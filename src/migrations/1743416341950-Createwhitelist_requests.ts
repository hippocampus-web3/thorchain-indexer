import { MigrationInterface, QueryRunner } from "typeorm";

export class Createwhitelist_requests1743416341950 implements MigrationInterface {
    name = 'Createwhitelist_requests1743416341950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "whitelist_requests" (
                "id" SERIAL NOT NULL,
                "nodeAddress" character varying NOT NULL,
                "userAddress" character varying NOT NULL,
                "intendedBondAmount" integer NOT NULL,
                "txId" character varying NOT NULL,
                "height" integer NOT NULL,
                "timestamp" TIMESTAMP NOT NULL,
                CONSTRAINT "PK_whitelist_requests" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "whitelist_requests"`);
    }
} 