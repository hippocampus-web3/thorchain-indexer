import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTargetTotalBondToNodeListings1743420000004 implements MigrationInterface {
    name = 'AddTargetTotalBondToNodeListings1743420000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "node_listings" ADD "targetTotalBond" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "node_listings" DROP COLUMN "targetTotalBond"`);
    }
} 