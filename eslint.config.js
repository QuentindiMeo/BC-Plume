const {
  defineConfig,
  globalIgnores,
} = require("eslint/config");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const globals = require("globals");
const js = require("@eslint/js");

const {
  FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

module.exports = defineConfig([{
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2020,
    sourceType: "module",

    parserOptions: {
      project: "./tsconfig.json",
    },

    globals: {
      ...globals.browser,
      ...globals.webextensions,
    },
  },

  extends: compat.extends("eslint:recommended", "@typescript-eslint/recommended"),

  plugins: {
    "@typescript-eslint": typescriptEslint,
  },

  rules: {
    "@typescript-eslint/no-unused-vars": ["error", {
      argsIgnorePattern: "^_",
    }],

    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "prefer-const": "error",
    "no-var": "error",
  },
}, globalIgnores(["**/dist/", "**/build/", "**/node_modules/", "**/*.js"])]);
