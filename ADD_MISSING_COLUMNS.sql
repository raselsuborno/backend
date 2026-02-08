-- Run this SQL in your database to add the missing columns
-- This fixes the error: "The column `bookings.completionPhotoUrl` does not exist"

ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "completionPhotoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "workerNotes" TEXT;
