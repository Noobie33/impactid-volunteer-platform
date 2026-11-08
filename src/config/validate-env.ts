export function validateEnvironment(env: Record<string, unknown>) {
  const required = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_DATABASE",
    "JWT_BEARER_SECRET",
  ];
  const missing = required.filter((key) => !String(env[key] ?? "").trim());

  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  const dbPort = Number(env.DB_PORT);
  if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error("DB_PORT must be a valid TCP port");
  }

  const port = Number(env.PORT ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  if (
    env.NODE_ENV === "production" &&
    String(env.JWT_BEARER_SECRET).length < 32
  ) {
    throw new Error(
      "JWT_BEARER_SECRET must be at least 32 characters in production",
    );
  }

  return env;
}
