import type { Config } from "jest";

const config: Config = {
  verbose: true,
  bail: 1,
  transformIgnorePatterns: [
    "/node_modules/(?!(@wagmi|p-cancelable|@szmarczak|react-icons)/)",
  ],
};

export default config;
