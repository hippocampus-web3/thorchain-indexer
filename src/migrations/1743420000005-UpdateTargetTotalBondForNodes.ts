import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTargetTotalBondForNodes1743420000005 implements MigrationInterface {
    name = 'UpdateTargetTotalBondForNodes1743420000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update targetTotalBond for specific nodes
        await queryRunner.query(`
            UPDATE "node_listings" 
            SET "targetTotalBond" = CASE 
                WHEN "nodeAddress" = 'thor1m2wc44uct7u0avwqrcxjtnlljvsnrzk32qmlrc' THEN 98952475518314
                WHEN "nodeAddress" = 'thor1wd59r6pn0fdaxpu2vcgjypfzr9qh34rhml07ns' THEN 99879382105990
                WHEN "nodeAddress" = 'thor1hgjgm68hrgwtvcj7rxzp0zsh9pmaar6g9kfpay' THEN 89771663465493
                WHEN "nodeAddress" = 'thor1rp6ll4p2qrj5k9mfelzmwv7ht0gv26pqxka8py' THEN 89772425831173
                WHEN "nodeAddress" = 'thor16xxh3kmd4fsadhf4u92gdte2nnhlw8rhjgw245' THEN 91252902000000
                WHEN "nodeAddress" = 'thor1x2whgc2nt665y0kc44uywhynazvp0l8tp0vtu6' THEN 90001263045488
                WHEN "nodeAddress" = 'thor1a7ut4mcte44aq8mun6lhj3rh73j95m08hfdvsr' THEN 99917384224318
                WHEN "nodeAddress" = 'thor1s6xz88ell5c6erd7hspfjw8syce89mgn32z6gr' THEN 94050204000000
                WHEN "nodeAddress" = 'thor1z6lg2u2kxccnmz3xy65856mcuslwaxcvx56uuk' THEN 137973494000000
                WHEN "nodeAddress" = 'thor16hw3da67jrctj6cjn9lrz4vwrwtap73um2m2p7' THEN 97872223799069
                WHEN "nodeAddress" = 'thor18h4xkczkd7g765n647t8clzp58cqet44n9s69g' THEN 100000000000000
            END
            WHERE "nodeAddress" IN (
                'thor1m2wc44uct7u0avwqrcxjtnlljvsnrzk32qmlrc',
                'thor1wd59r6pn0fdaxpu2vcgjypfzr9qh34rhml07ns',
                'thor1hgjgm68hrgwtvcj7rxzp0zsh9pmaar6g9kfpay',
                'thor1rp6ll4p2qrj5k9mfelzmwv7ht0gv26pqxka8py',
                'thor16xxh3kmd4fsadhf4u92gdte2nnhlw8rhjgw245',
                'thor1x2whgc2nt665y0kc44uywhynazvp0l8tp0vtu6',
                'thor1a7ut4mcte44aq8mun6lhj3rh73j95m08hfdvsr',
                'thor1s6xz88ell5c6erd7hspfjw8syce89mgn32z6gr',
                'thor1z6lg2u2kxccnmz3xy65856mcuslwaxcvx56uuk',
                'thor16hw3da67jrctj6cjn9lrz4vwrwtap73um2m2p7',
                'thor18h4xkczkd7g765n647t8clzp58cqet44n9s69g'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Set targetTotalBond to NULL for the updated nodes
        await queryRunner.query(`
            UPDATE "node_listings" 
            SET "targetTotalBond" = NULL
            WHERE "nodeAddress" IN (
                'thor1m2wc44uct7u0avwqrcxjtnlljvsnrzk32qmlrc',
                'thor1wd59r6pn0fdaxpu2vcgjypfzr9qh34rhml07ns',
                'thor1hgjgm68hrgwtvcj7rxzp0zsh9pmaar6g9kfpay',
                'thor1rp6ll4p2qrj5k9mfelzmwv7ht0gv26pqxka8py',
                'thor16xxh3kmd4fsadhf4u92gdte2nnhlw8rhjgw245',
                'thor1x2whgc2nt665y0kc44uywhynazvp0l8tp0vtu6',
                'thor1a7ut4mcte44aq8mun6lhj3rh73j95m08hfdvsr',
                'thor1s6xz88ell5c6erd7hspfjw8syce89mgn32z6gr',
                'thor1z6lg2u2kxccnmz3xy65856mcuslwaxcvx56uuk',
                'thor16hw3da67jrctj6cjn9lrz4vwrwtap73um2m2p7',
                'thor18h4xkczkd7g765n647t8clzp58cqet44n9s69g'
            )
        `);
    }
} 