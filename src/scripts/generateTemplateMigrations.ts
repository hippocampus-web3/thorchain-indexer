import { TemplateLoader } from '../loadTemplates';
import { writeFileSync } from 'fs';
import { join } from 'path';

function generateMigrationContent(template: any, timestamp: number): string {
    const columns = Object.entries(template.columns)
        .map(([name, type]) => {
            let sqlType = 'character varying';
            switch (type) {
                case 'int':
                    sqlType = 'integer';
                    break;
                case 'timestamp':
                    sqlType = 'TIMESTAMP';
                    break;
                case 'string':
                default:
                    sqlType = 'character varying';
            }
            return `"${name}" ${sqlType} NOT NULL`;
        })
        .join(',\n                ');

    return `import { MigrationInterface, QueryRunner } from "typeorm";

export class Create${template.table}${timestamp} implements MigrationInterface {
    name = 'Create${template.table}${timestamp}'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`
            CREATE TABLE "${template.table}" (
                "id" SERIAL NOT NULL,
                ${columns},
                CONSTRAINT "PK_${template.table}" PRIMARY KEY ("id")
            )
        \`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`DROP TABLE "${template.table}"\`);
    }
}`;
}

async function main() {
    const templateLoader = new TemplateLoader();
    const templates = templateLoader.loadTemplates();
    const timestamp = Date.now();

    for (const template of templates) {
        const migrationContent = generateMigrationContent(template, timestamp);
        const fileName = `${timestamp}-Create${template.table}.ts`;
        const filePath = join(__dirname, '..', 'migrations', fileName);
        
        writeFileSync(filePath, migrationContent);
        console.log(`Generated migration: ${fileName}`);
    }
}

main().catch(console.error); 