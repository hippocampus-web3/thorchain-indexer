import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToWhitelistRequests1743420000000 implements MigrationInterface {
    name = 'AddStatusToWhitelistRequests1743420000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "whitelist_request_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'bonded');
            ALTER TABLE "whitelist_requests" 
            ADD COLUMN "status" "whitelist_request_status_enum" NOT NULL DEFAULT 'pending';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "whitelist_requests" DROP COLUMN "status";
            DROP TYPE "whitelist_request_status_enum";
        `);
    }
} 