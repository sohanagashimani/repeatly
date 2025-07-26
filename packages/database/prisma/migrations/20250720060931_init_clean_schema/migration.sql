-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "headers" JSONB,
    "body" JSONB,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_jobs" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "scheduled_hour" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT NOT NULL DEFAULT 'scheduled',
    "job_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id", "scheduled_hour")
) PARTITION BY RANGE ("scheduled_hour");

-- Create 24 hourly partitions (0-23)
CREATE TABLE "scheduled_jobs_00" PARTITION OF "scheduled_jobs" FOR VALUES FROM (0) TO (1);
CREATE TABLE "scheduled_jobs_01" PARTITION OF "scheduled_jobs" FOR VALUES FROM (1) TO (2);
CREATE TABLE "scheduled_jobs_02" PARTITION OF "scheduled_jobs" FOR VALUES FROM (2) TO (3);
CREATE TABLE "scheduled_jobs_03" PARTITION OF "scheduled_jobs" FOR VALUES FROM (3) TO (4);
CREATE TABLE "scheduled_jobs_04" PARTITION OF "scheduled_jobs" FOR VALUES FROM (4) TO (5);
CREATE TABLE "scheduled_jobs_05" PARTITION OF "scheduled_jobs" FOR VALUES FROM (5) TO (6);
CREATE TABLE "scheduled_jobs_06" PARTITION OF "scheduled_jobs" FOR VALUES FROM (6) TO (7);
CREATE TABLE "scheduled_jobs_07" PARTITION OF "scheduled_jobs" FOR VALUES FROM (7) TO (8);
CREATE TABLE "scheduled_jobs_08" PARTITION OF "scheduled_jobs" FOR VALUES FROM (8) TO (9);
CREATE TABLE "scheduled_jobs_09" PARTITION OF "scheduled_jobs" FOR VALUES FROM (9) TO (10);
CREATE TABLE "scheduled_jobs_10" PARTITION OF "scheduled_jobs" FOR VALUES FROM (10) TO (11);
CREATE TABLE "scheduled_jobs_11" PARTITION OF "scheduled_jobs" FOR VALUES FROM (11) TO (12);
CREATE TABLE "scheduled_jobs_12" PARTITION OF "scheduled_jobs" FOR VALUES FROM (12) TO (13);
CREATE TABLE "scheduled_jobs_13" PARTITION OF "scheduled_jobs" FOR VALUES FROM (13) TO (14);
CREATE TABLE "scheduled_jobs_14" PARTITION OF "scheduled_jobs" FOR VALUES FROM (14) TO (15);
CREATE TABLE "scheduled_jobs_15" PARTITION OF "scheduled_jobs" FOR VALUES FROM (15) TO (16);
CREATE TABLE "scheduled_jobs_16" PARTITION OF "scheduled_jobs" FOR VALUES FROM (16) TO (17);
CREATE TABLE "scheduled_jobs_17" PARTITION OF "scheduled_jobs" FOR VALUES FROM (17) TO (18);
CREATE TABLE "scheduled_jobs_18" PARTITION OF "scheduled_jobs" FOR VALUES FROM (18) TO (19);
CREATE TABLE "scheduled_jobs_19" PARTITION OF "scheduled_jobs" FOR VALUES FROM (19) TO (20);
CREATE TABLE "scheduled_jobs_20" PARTITION OF "scheduled_jobs" FOR VALUES FROM (20) TO (21);
CREATE TABLE "scheduled_jobs_21" PARTITION OF "scheduled_jobs" FOR VALUES FROM (21) TO (22);
CREATE TABLE "scheduled_jobs_22" PARTITION OF "scheduled_jobs" FOR VALUES FROM (22) TO (23);
CREATE TABLE "scheduled_jobs_23" PARTITION OF "scheduled_jobs" FOR VALUES FROM (23) TO (24);

-- CreateTable
CREATE TABLE "job_executions" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "scheduled_job_id" TEXT NOT NULL,
    "scheduled_job_hour" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "response" JSONB,
    "error" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "job_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gcpKeyName" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'creating',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Job_userId_idx" ON "Job"("userId");

-- CreateIndex
CREATE INDEX "Job_enabled_idx" ON "Job"("enabled");

-- CreateIndex
CREATE INDEX "scheduled_jobs_scheduled_at_status_idx" ON "scheduled_jobs"("scheduled_at", "status");

-- CreateIndex
CREATE INDEX "scheduled_jobs_job_id_idx" ON "scheduled_jobs"("job_id");

-- CreateIndex
CREATE INDEX "scheduled_jobs_scheduled_hour_status_idx" ON "scheduled_jobs"("scheduled_hour", "status");

-- CreateIndex
CREATE INDEX "job_executions_job_id_idx" ON "job_executions"("job_id");

-- CreateIndex
CREATE INDEX "job_executions_scheduled_job_id_scheduled_job_hour_idx" ON "job_executions"("scheduled_job_id", "scheduled_job_hour");

-- CreateIndex
CREATE INDEX "job_executions_status_idx" ON "job_executions"("status");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_gcpKeyName_key" ON "ApiKey"("gcpKeyName");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_scheduled_job_id_scheduled_job_hour_fkey" FOREIGN KEY ("scheduled_job_id", "scheduled_job_hour") REFERENCES "scheduled_jobs"("id", "scheduled_hour") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
