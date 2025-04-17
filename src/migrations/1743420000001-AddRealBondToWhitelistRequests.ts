import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRealBondToWhitelistRequests1743420000001 implements MigrationInterface {
    name = 'AddRealBondToWhitelistRequests1743420000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "whitelist_requests" 
            ADD COLUMN "realBond" bigint NOT NULL DEFAULT 0;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "whitelist_requests" DROP COLUMN "realBond";
        `);
    }
} 