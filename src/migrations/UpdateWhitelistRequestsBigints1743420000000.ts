import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWhitelistRequestsBigints1743420000000 implements MigrationInterface {
    name = 'UpdateWhitelistRequestsBigints1743420000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "whitelist_requests"
            ALTER COLUMN "intendedBondAmount" TYPE bigint USING "intendedBondAmount"::bigint
        `);
        await queryRunner.query(`
            ALTER TABLE "whitelist_requests"
            ALTER COLUMN "height" TYPE bigint USING "height"::bigint
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "whitelist_requests"
            ALTER COLUMN "intendedBondAmount" TYPE integer USING "intendedBondAmount"::integer
        `);
        await queryRunner.query(`
            ALTER TABLE "whitelist_requests"
            ALTER COLUMN "height" TYPE integer USING "height"::integer
        `);
    }
}
