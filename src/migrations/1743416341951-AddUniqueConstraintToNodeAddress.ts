import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintToNodeAddress1743416341951 implements MigrationInterface {
    name = 'AddUniqueConstraintToNodeAddress1743416341951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Luego, añadir la restricción única
        await queryRunner.query(`
            ALTER TABLE "node_listings"
            ADD CONSTRAINT "UQ_node_address" UNIQUE ("nodeAddress")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "node_listings"
            DROP CONSTRAINT "UQ_node_address"
        `);
    }
} 