CREATE TYPE "Recurrence" AS ENUM ('NONE', 'WEEKLY');

ALTER TABLE "tasks" ADD COLUMN "recurrence" "Recurrence" NOT NULL DEFAULT 'NONE';
