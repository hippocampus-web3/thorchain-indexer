import { MigrationInterface, QueryRunner } from "typeorm";

export class Createnode_listings1743416341949 implements MigrationInterface {
    name = 'Createnode_listings1743416341949'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "node_listings" (
                "id" SERIAL NOT NULL,
                "nodeAddress" character varying NOT NULL,
                "operatorAddress" character varying NOT NULL,
                "minRune" integer NOT NULL,
                "maxRune" integer NOT NULL,
                "feePercentage" integer NOT NULL,
                "txId" character varying NOT NULL,
                "height" integer NOT NULL,
                "timestamp" TIMESTAMP NOT NULL,
                CONSTRAINT "PK_node_listings" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "node_listings"`);
    }
}