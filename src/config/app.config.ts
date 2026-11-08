import "dotenv/config";

/** Shared configuration for optional modules (Redis, mail, etc.). */
export const appConfig = {
  default_schema_identifier: "public",
  default_migrations_folder: __dirname + "/../database/migrations",
  default_seeders_folder: __dirname + "/../database/seeders",
  recommended_bycrypt_rounds: 12,
  env: {
    REDIS_URL:
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`,
  },
};
