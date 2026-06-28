import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1782648872478 implements MigrationInterface {
    name = 'Init1782648872478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Required for uuid_generate_v4() used by the uuid primary keys.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."challenges_difficulty_enum" AS ENUM('easy', 'medium', 'hard')`);
        await queryRunner.query(`CREATE TABLE "challenges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "artist" character varying(255) NOT NULL, "description" text NOT NULL, "points" integer NOT NULL, "durationSeconds" integer NOT NULL, "difficulty" "public"."challenges_difficulty_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1e664e93171e20fe4d6125466af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fac5687ac70047314a7fb12112" ON "challenges" ("isActive") `);
        await queryRunner.query(`CREATE TABLE "challenge_completions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "challengeId" uuid NOT NULL, "pointsEarned" integer NOT NULL, "listenPercentage" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_02cdc0f2c385611ee53c90a38f8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d4d11f8a530ef3b88b5e8161d2" ON "challenge_completions" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_da4132b85b217acdddb7878c20" ON "challenge_completions" ("challengeId") `);
        await queryRunner.query(`CREATE TABLE "rewards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text NOT NULL, "pointsCost" integer NOT NULL, "isAvailable" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3d947441a48debeb9b7366f8b8c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_954fe2b291d91c0e7114db4436" ON "rewards" ("isAvailable") `);
        await queryRunner.query(`CREATE TYPE "public"."reward_redemptions_status_enum" AS ENUM('pending', 'fulfilled', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "reward_redemptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "rewardId" uuid NOT NULL, "pointsSpent" integer NOT NULL, "status" "public"."reward_redemptions_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e02d178fa8c54295d8edc8781b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5490172918e20aa466c63c9ac1" ON "reward_redemptions" ("userId") `);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character varying(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c25bc63d248ca90e8dcc1d92d0" ON "refresh_tokens" ("tokenHash") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "displayName" character varying(100), "totalPoints" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "challenge_completions" ADD CONSTRAINT "FK_d4d11f8a530ef3b88b5e8161d23" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "challenge_completions" ADD CONSTRAINT "FK_da4132b85b217acdddb7878c20d" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reward_redemptions" ADD CONSTRAINT "FK_5490172918e20aa466c63c9ac12" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reward_redemptions" ADD CONSTRAINT "FK_7405900a3e5b2843630b0a83cbe" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`ALTER TABLE "reward_redemptions" DROP CONSTRAINT "FK_7405900a3e5b2843630b0a83cbe"`);
        await queryRunner.query(`ALTER TABLE "reward_redemptions" DROP CONSTRAINT "FK_5490172918e20aa466c63c9ac12"`);
        await queryRunner.query(`ALTER TABLE "challenge_completions" DROP CONSTRAINT "FK_da4132b85b217acdddb7878c20d"`);
        await queryRunner.query(`ALTER TABLE "challenge_completions" DROP CONSTRAINT "FK_d4d11f8a530ef3b88b5e8161d23"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c25bc63d248ca90e8dcc1d92d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5490172918e20aa466c63c9ac1"`);
        await queryRunner.query(`DROP TABLE "reward_redemptions"`);
        await queryRunner.query(`DROP TYPE "public"."reward_redemptions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_954fe2b291d91c0e7114db4436"`);
        await queryRunner.query(`DROP TABLE "rewards"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da4132b85b217acdddb7878c20"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d4d11f8a530ef3b88b5e8161d2"`);
        await queryRunner.query(`DROP TABLE "challenge_completions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fac5687ac70047314a7fb12112"`);
        await queryRunner.query(`DROP TABLE "challenges"`);
        await queryRunner.query(`DROP TYPE "public"."challenges_difficulty_enum"`);
    }

}
