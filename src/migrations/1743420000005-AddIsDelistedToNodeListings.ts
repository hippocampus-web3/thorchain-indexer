import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDelistedToNodeListings1743420000005 implements MigrationInterface {
    name = 'AddIsDelistedToNodeListings1743420000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "node_listings" ADD "isDelisted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "node_listings" DROP COLUMN "isDelisted"`);
    }
} 