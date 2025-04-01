import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMinMaxRuneToBigint1743419999999 implements MigrationInterface {
    name = 'UpdateMinMaxRuneToBigint1743419999999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "node_listings"
            ALTER COLUMN "minRune" TYPE bigint USING "minRune"::bigint
        `);
        await queryRunner.query(`
            ALTER TABLE "node_listings"
            ALTER COLUMN "maxRune" TYPE bigint USING "maxRune"::bigint
        `);
        await queryRunner.query(`
            ALTER TABLE "node_listings"
            ALTER COLUMN "height" TYPE bigint USING "height"::bigint
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "node_listings"
            ALTER COLUMN "minRune" TYPE integer USING "minRune"::integer
        `);
        await queryRunner.query(`
            ALTER TABLE "node_listings"
            ALTER COLUMN "maxRune" TYPE integer USING "maxRune"::integer
        `);
        await queryRunner.query(`
            ALTER TABLE "node_listings"
            ALTER COLUMN "height" TYPE integer USING "height"::integer
        `);
    }
}
