// @ts-check

import eslint from "@eslint/js";
import tslint from "typescript-eslint";
import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath, URL } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default tslint.config(
  eslint.configs.recommended,
  tslint.configs.recommended,
  includeIgnoreFile(gitignorePath), // do not lint files that are git ignored
);
