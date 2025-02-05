// import antlr4 from "antlr4";
// console.log(".................", Object.keys(antlr4));
// console.log(".................", Object.keys(antlr4.tree));

import { parseTypeOnly } from "./dist/api.js";

// const source = `
// type T1 = number[] | string;
// `;
// const ast = parseTypeOnly({ source });
// console.log(JSON.stringify(ast, null, 2));

const source = "2-a";
const ast = parseTypeOnly({ source });
console.log(JSON.stringify(ast, null, 2));
// const namedType = ast.declarations?.[0];
