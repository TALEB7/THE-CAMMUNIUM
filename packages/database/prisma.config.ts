import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // We use process.env here so the build doesn't crash if the variable is missing locally
    url: process.env.DATABASE_URL!
  }
});
