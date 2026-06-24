const expoConfig = require("eslint-config-expo/flat");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/**", "coverage/**", ".expo/**", "node_modules/**"]
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "import/no-named-as-default-member": "off",
      "no-console": ["error", { "allow": ["warn", "error"] }],
      "import/no-restricted-paths": [
        "error",
        {
          "zones": [
            {
              "target": "./src/domain",
              "from": "./src/application",
              "message": "Domain must not depend on application."
            },
            {
              "target": "./src/domain",
              "from": "./src/infrastructure",
              "message": "Domain must not depend on infrastructure."
            },
            {
              "target": "./src/domain",
              "from": "./src/presentation",
              "message": "Domain must not depend on presentation."
            },
            {
              "target": "./src/domain",
              "from": "./src/framework",
              "message": "Domain must not depend on framework code."
            },
            {
              "target": "./src/application",
              "from": "./src/infrastructure",
              "message": "Application must depend on ports, not infrastructure."
            },
            {
              "target": "./src/application",
              "from": "./src/presentation",
              "message": "Application must not depend on presentation."
            },
            {
              "target": "./src/application",
              "from": "./src/framework",
              "message": "Application must not depend on framework code."
            },
            {
              "target": "./src/presentation",
              "from": "./src/domain",
              "message": "Presentation must consume application DTOs, not domain types."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/domain/**/*.{ts,tsx}", "src/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["nativewind", "nativewind/*", "zustand", "zustand/*"],
              "message": "UI styling/state libraries are forbidden in domain and application layers."
            },
            {
              "group": ["react-native", "expo", "expo-*", "react", "react/*"],
              "message": "Domain/application code must stay independent from React, React Native, and Expo."
            }
          ]
        }
      ]
    }
  }
];
