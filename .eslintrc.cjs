/** @type {import("eslint").Linter.Config} */
module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ],
    parserOptions: {
        project: ["./packages/*/tsconfig.json"],
        tsconfigRootDir: __dirname,
    },
    rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "@typescript-eslint/consistent-type-imports": "error",
    },
};
