import { validateEnvironment } from "./validate-env";

const valid = {
  DB_HOST: "localhost",
  DB_PORT: "5432",
  DB_USER: "postgres",
  DB_DATABASE: "impactid_test",
  JWT_BEARER_SECRET: "a-local-development-secret",
};

describe("environment validation", () => {
  it("accepts valid local configuration", () => {
    expect(validateEnvironment(valid)).toBe(valid);
  });

  it("rejects missing required database configuration", () => {
    expect(() => validateEnvironment({ ...valid, DB_DATABASE: "" })).toThrow(
      /DB_DATABASE/,
    );
  });

  it("rejects invalid ports", () => {
    expect(() => validateEnvironment({ ...valid, DB_PORT: "oops" })).toThrow(
      /DB_PORT/,
    );
  });

  it("requires a sufficiently long production JWT secret", () => {
    expect(() =>
      validateEnvironment({
        ...valid,
        NODE_ENV: "production",
        JWT_BEARER_SECRET: "short",
      }),
    ).toThrow(/JWT_BEARER_SECRET/);
  });
});
