const eslint = require("@typescript-eslint/eslint-plugin");
const parser = require("@typescript-eslint/parser");

module.exports = [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": eslint,
    },
    rules: {
      "no-console": "off", // Allowed for this project (logging)
      "@typescript-eslint/no-explicit-any": "off", // Allowed for streams
      "@typescript-eslint/no-unused-vars": "warn"
    },
  },
];
