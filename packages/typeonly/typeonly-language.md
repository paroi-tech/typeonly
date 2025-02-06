# TypeOnly Language

TypeOnly is a strict subset of TypeScript: any code that compiles with TypeOnly will also compile with TypeScript.

An example of TypeOnly source files:

```ts
// pencil-json-def.d.ts
import { Color } from "./constants"

export interface JsonDef {
  pencils: Pencil[]
}

export interface Pencil {
  color: Color
  size: "normal" | "small"
}
```

```ts
// constants.d.ts

export type Color = "red" | "green" | "blue"
```

# Allowed declarations

A TypeOnly _module_ is a set of declarations. There are three sort of declarations: _imports_, _named types_ and _named interfaces_.

Notice: Our naming slightly differs from that of TypeScript, especially on what we call an "interface".

# Module, export, import

A TypeOnly source file is called a _module_. Exported members can be imported the same way as ECMAScript modules, except that default imports or exports are not allowed.

The `export` keyword on named types or named interfaces is optional. Only the module members with an `export` keyword can be imported from outside the module.

# Named Type

A named type starts with the optional keyword `export` followed by the `type` keyword, then a type name as an identifier, the `=` character, and a type definition. Example:

```ts
type T1 = boolean
```

# Named Interface

A named interface is a named type that starts with the optional keyword `export` followed by the `interface` keyword, then an interface name as an identifier, and the interface definition. Example:

```ts
interface I1 {
  prop1: boolean
}
```

# Types

## Interface

An interface definition is surrounded by curly brackets `{` and `}`. It can contain three sort of entries: a list of properties, an index signature, and a mapped index signature.

A **property** definition is composed with a name and a type. An example of interface with two properties:

```ts
{
  prop1: boolean
  prop2: number
}
```

An example of interface with an **index signature**:

```ts
{
  [propName: string]: boolean
}
```

An example of interface with a **mapped index signature**:

```ts
{
  [K in "prop1" | "prop2"]: boolean
}
```

Notice: An index signature can be mixed with properties in accordance with TypeScript rules. But a mapped index signature is incompatible with an index signature or properties. Additionally, a named interface cannot contains a mapped index signature.

## Type Name

Here are the accepted type names:

* **Primitive type names:** `string`, `number`, `bigint`, `boolean`, `symbol`, `null`, `undefined`;
* **TypeScript type names:** `any`, `unknown`, `object`, `void`, `never`;
* **JavaScript type names:** `String`, `Number`, `Bigint`, `Boolean`, `Symbol`, `Date`;
* **Global type names:** A list of global types can be provided as an option;
* **Local type names:** Names of named types in the same module;
* **Imported type names:** Names of imported named types that are exported from other modules;
* **Generic parameter names:** Names of generic parameters in declared parent scopes.

## Literal Type

A literal type is a literal value in one of the following primitive types: `string`, `number`, `bigint`, `boolean`. An example:

```ts
"a"
```

## Composite Type

A composite type is a union (`|`) or an intersection (`&`) of types. An example:

```ts
"a" | "b" | undefined
```

## Array Type

An array type represents an array of items with the same type. Two syntaxes are accepted.

An example with the short syntax:

```ts
string[]
```

The same example with the generic syntax:

```ts
Array<string>
```

## Tuple Type

A tuple type is a fixed list of types. An example:

```ts
[boolean, string, number]
```

## Keyof Type

A keyof type represents an union of property names. An example:

```ts
keyof T1
```

## Member Type

A member type is the type of a property in a parent type. Example:

```ts
T1.prop1
```

## Generic Instance

A generic instance is a type which is an instance of a generic type. An example:

```ts
T1<boolean, number>
```



