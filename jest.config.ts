import type { Config } from "jest";

const config: Config = {
  preset: "jest-expo",
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.test.tsx"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
};

export default config;
