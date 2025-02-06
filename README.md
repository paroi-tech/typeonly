# Monorepo for TypeOnly

[![Build Status](https://travis-ci.com/paroi-tech/typeonly.svg?branch=master)](https://travis-ci.com/paroi-tech/typeonly)

**TypeOnly** is a lightweight validation library that uses TypeScript type definitions to validate JSON data. **[Learn more about TypeOnly here](https://github.com/paroi-tech/typeonly/tree/master/packages/typeonly)**.

## Projects

* [typeonly](https://github.com/paroi-tech/typeonly/tree/master/packages/typeonly): Parses types and interfaces from TypeScript and stores them as JSON files;
* [@typeonly/loader](https://github.com/paroi-tech/typeonly/tree/master/packages/loader): Brings types and interfaces from TypeScript at runtime;
* [@typeonly/validator](https://github.com/paroi-tech/typeonly/tree/master/packages/validator): An API to validate JSON data or JavaScript objects, using TypeScript typing definitions;
* [@typeonly/validator-cli](https://github.com/paroi-tech/typeonly/tree/master/packages/validator-cli): A CLI to validate JSON files, using TypeScript typing definitions.

## Contribute

### Install and Build

We need a JVM (Java Virtual Machine) to build the parser because we use [ANTLR](https://www.antlr.org/), which is a Java program. So, at first, install a JVM on your system.

In a terminal, open the cloned `typeonly/typeonly/` repository. Then:

```sh
# Download once the ANTLR JAR file in the project's root directory
wget https://www.antlr.org/download/antlr-4.13.2-complete.jar

# Install once all Node.js dependencies
npm install
```

### Development environment

With VS Code, our recommanded plugins are:

- **Biome** from biomejs (biomejs.dev)
- **ANTLR4 grammar syntax support** from Mike Lischke (`mike-lischke.vscode-antlr4`)
