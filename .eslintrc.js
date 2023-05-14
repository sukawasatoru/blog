/*
 * Copyright 2019, 2021, 2022, 2023 sukawasatoru
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'next/core-web-vitals',
  ],
  root: true,
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'react-hooks/exhaustive-deps': [
      'warn', {
        // for recoil https://recoiljs.org/docs/introduction/installation#eslint
        'additionalHooks': '(useRecoilCallback|useRecoilTransaction_UNSTABLE)'
      },
    ],
    '@typescript-eslint/member-delimiter-style': 'warn',
    '@typescript-eslint/member-ordering': 'warn',
    '@typescript-eslint/no-base-to-string': 'error',
    '@typescript-eslint/no-confusing-non-null-assertion': 'error',
    '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/prefer-includes': 'error',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/triple-slash-reference': 'warn',
    '@typescript-eslint/unified-signatures': 'error',
    '@typescript-eslint/adjacent-overload-signatures': 'warn',
    'import/first': 'error',
    'import/order': ['error', {
      alphabetize: {
        order: 'asc',
      },
      warnOnUnassignedImports: true,
    }],
    'lines-between-class-members': 'error',
    'no-multiple-empty-lines': ['error', {
      max: 2,
      maxEOF: 0,
    }],
    'no-trailing-spaces': 'error',
    'quotes': ['error', 'single', {
      allowTemplateLiterals: true,
    }],
    'semi': ['error', 'always'],
  },
};
