# @typeonly/validator-cli

[![Build Status](https://travis-ci.com/paroi-tech/typeonly.svg?branch=master)](https://travis-ci.com/paroi-tech/typeonly)
[![npm](https://img.shields.io/npm/dm/@typeonly/validator-cli)](https://www.npmjs.com/package/@typeonly/validator-cli)
![Type definitions](https://img.shields.io/npm/types/@typeonly/validator-cli)
![GitHub](https://img.shields.io/github/license/paroi-tech/typeonly)

This package is part of **TypeOnly**, a lightweight validation library that uses TypeScript type definitions to validate JSON data. **[Learn more about TypeOnly here](https://www.npmjs.com/package/typeonly)**.

## Command Line Interface of the Validator

Example:

```sh
npx @typeonly/validator-cli -s src/file-name.d.ts -t RootTypeName data.json
```

Available options:

```
  -h, --help                       Print this help message.
  -s, --source file.d.ts           The typing file (one file allowed).
  --source-encoding string         Encoding for typing files (default is utf8).
  --source-dir directory           The source directory that contains typing files (optional).
  --rto-module file.rto.json       The rto.json file to process (one file allowed).
  --rto-dir directory              The source directory for rto.json file (optional).
  -t, --type string                The type name of the root element in JSON.
  --non-strict                     Enable non-strict mode (accept extra properties).
  -e, --json-encoding string       Encoding for JSON file to validate (default is utf8).
  --json file.json                 The JSON file to validate (by default at last position, one file allowed).
```
