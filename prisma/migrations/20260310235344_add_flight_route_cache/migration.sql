-- CreateTable
CREATE TABLE "FlightRouteCache" (
    "callsign" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "originIata" TEXT,
    "originName" TEXT,
    "destinationIata" TEXT,
    "destinationName" TEXT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlightRouteCache_pkey" PRIMARY KEY ("callsign","date")
);
