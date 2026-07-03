-- CreateTable
CREATE TABLE "Kita" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "cost" DECIMAL(10,2),
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "hasVacancies" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Kita_latitude_longitude_idx" ON "Kita"("latitude", "longitude");
