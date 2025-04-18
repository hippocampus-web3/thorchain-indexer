import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatMessages1743420000002 implements MigrationInterface {
    name = 'CreateChatMessages1743420000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "chat_messages_role_enum" AS ENUM('BP', 'NO', 'USER');
        `);

        await queryRunner.query(`
            CREATE TABLE "chat_messages" (
                "id" SERIAL NOT NULL,
                "nodeAddress" character varying NOT NULL,
                "userAddress" character varying NOT NULL,
                "message" text NOT NULL,
                "role" "chat_messages_role_enum" NOT NULL,
                "txId" character varying NOT NULL,
                "height" integer NOT NULL,
                "timestamp" TIMESTAMP NOT NULL,
                CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "chat_messages" 
            ADD CONSTRAINT "FK_chat_messages_node_listings" 
            FOREIGN KEY ("nodeAddress") 
            REFERENCES "node_listings"("nodeAddress") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "chat_messages"`);
        await queryRunner.query(`DROP TYPE "chat_messages_role_enum"`);
    }
} 