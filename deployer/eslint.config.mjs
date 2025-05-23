import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {files: ["**/*.{ts}"] },
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  { rules: {
    '@typescript-eslint/no-explicit-any': 'off', // Disable the rule globally
  },
},
];