-- CreateTable
CREATE TABLE "Airport" (
    "iata" TEXT NOT NULL,
    "icao" TEXT,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "type" TEXT,
    "municipality" TEXT,
    "country" TEXT,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("iata")
);
