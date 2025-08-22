import { db } from "./server/db";
import { announcements } from "@shared/schema";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    const result = await db.select().from(announcements).limit(1);
    console.log("Database connection successful!");
    console.log("Result:", result);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

testConnection();
