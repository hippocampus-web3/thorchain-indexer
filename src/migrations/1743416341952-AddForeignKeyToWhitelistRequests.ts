import { MigrationInterface, QueryRunner } from "typeorm";

export class AddForeignKeyToWhitelistRequests1743416341952 implements MigrationInterface {
    name = 'AddForeignKeyToWhitelistRequests1743416341952'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Luego, añadir la foreign key
        await queryRunner.query(`
            ALTER TABLE "whitelist_requests"
            ADD CONSTRAINT "FK_whitelist_node" 
            FOREIGN KEY ("nodeAddress") 
            REFERENCES "node_listings"("nodeAddress") 
            ON DELETE CASCADE
        `);

        // Crear índice para mejorar el rendimiento
        await queryRunner.query(`
            CREATE INDEX "IDX_whitelist_node_address" 
            ON "whitelist_requests"("nodeAddress")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_whitelist_node_address"`);
        await queryRunner.query(`
            ALTER TABLE "whitelist_requests"
            DROP CONSTRAINT "FK_whitelist_node"
        `);
    }
} 