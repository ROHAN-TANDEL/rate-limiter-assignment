/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    // Strip .js extension only from relative imports (not node_modules)
    moduleNameMapper: {
        "^(\\.{1,2}/.+)\\.js$": "$1",
    },
    testMatch: ["**/test/**/*.test.ts"],
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.test.json",
        },
    },
};
