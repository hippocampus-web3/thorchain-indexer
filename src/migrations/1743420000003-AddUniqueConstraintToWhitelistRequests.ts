import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintToWhitelistRequests1743420000003 implements MigrationInterface {
    name = 'AddUniqueConstraintToWhitelistRequests1743420000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, remove any potential duplicates, keeping the most recent record (highest ID)
        await queryRunner.query(`
            DELETE FROM whitelist_requests wr1
            USING whitelist_requests wr2
            WHERE wr1.id < wr2.id
            AND wr1."nodeAddress" = wr2."nodeAddress"
            AND wr1."userAddress" = wr2."userAddress"
        `);

        // Then add the unique constraint
        await queryRunner.query(`
            ALTER TABLE whitelist_requests
            ADD CONSTRAINT "UQ_WHITELIST_REQUEST"
            UNIQUE ("nodeAddress", "userAddress")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE whitelist_requests
            DROP CONSTRAINT "UQ_WHITELIST_REQUEST"
        `);
    }
} 