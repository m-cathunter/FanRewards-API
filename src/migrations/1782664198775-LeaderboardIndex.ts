import { MigrationInterface, QueryRunner } from "typeorm";

export class LeaderboardIndex1782664198775 implements MigrationInterface {
    name = 'LeaderboardIndex1782664198775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_ba78ce3a5acde2028ae204f1a6" ON "users" ("totalPoints") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_ba78ce3a5acde2028ae204f1a6"`);
    }

}
