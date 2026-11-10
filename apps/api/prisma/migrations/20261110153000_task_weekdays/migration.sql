ALTER TABLE "tasks" ADD COLUMN "weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

UPDATE "tasks"
SET "weekdays" = ARRAY[EXTRACT(DOW FROM "date")::integer]
WHERE "recurrence" = 'WEEKLY';
