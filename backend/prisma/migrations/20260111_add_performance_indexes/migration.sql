-- Performance optimization indexes for scaling to millions of users

-- User table indexes
CREATE INDEX IF NOT EXISTS "User_subscriptionEndDate_idx" ON "User"("subscriptionEndDate");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "User_authProvider_createdAt_idx" ON "User"("authProvider", "createdAt");

-- Visit table indexes (for leaderboard and analytics)
CREATE INDEX IF NOT EXISTS "Visit_userId_isVerified_idx" ON "Visit"("userId", "isVerified");
CREATE INDEX IF NOT EXISTS "Visit_visitDate_idx" ON "Visit"("visitDate");
CREATE INDEX IF NOT EXISTS "Visit_userId_visitDate_idx" ON "Visit"("userId", "visitDate");

-- Attraction table indexes (for search and filtering)
CREATE INDEX IF NOT EXISTS "Attraction_cityId_category_idx" ON "Attraction"("cityId", "category");
CREATE INDEX IF NOT EXISTS "Attraction_name_idx" ON "Attraction"("name");

-- Review table indexes
CREATE INDEX IF NOT EXISTS "Review_attractionId_rating_idx" ON "Review"("attractionId", "rating");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review"("createdAt");

-- DailyScan table index
CREATE INDEX IF NOT EXISTS "DailyScan_scanDate_idx" ON "DailyScan"("scanDate");
