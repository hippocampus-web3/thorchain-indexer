import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeMaxRuneNullable1743420000006 implements MigrationInterface {
    name = 'MakeMaxRuneNullable1743420000006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "node_listings" 
            ALTER COLUMN "maxRune" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Set all NULL values to 0 before making the column NOT NULL
        await queryRunner.query(`
            UPDATE "node_listings" 
            SET "maxRune" = 0 
            WHERE "maxRune" IS NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "node_listings" 
            ALTER COLUMN "maxRune" SET NOT NULL
        `);
    }
} 