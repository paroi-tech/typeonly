const { parseTypeOnlyToAst } = require("./parse-typeonly")

// const test = "type T1 = `\"abc\"` "
// const test = "type T1 = 'true' "
// const test = `
// type T1 = "ZD"
// `

const test = `interface I1 {
  a: {
    b: string
  }
}`

// const test = `
// type T1 = {
//   df?: string
//   readonly ff: number,
// }
// `

// const test = `
// export interface D extends exc, kk {
//   df?: string
//   readonly ff: number,
// },


// interface add {};interface add {}`
// const test = `export type df = string`
// const test = `



// //dsdsd



// export interface               $_abc12   extends dff  ,  dds








// {





//   sd : string




//   df:string
// }                 interface _$dffs
// {
//   ff:string
//   cc:string
// }



// `

// const test = ``;

// const test = `interface Abc{ab:
//   dc:
// }interface Abc2{abs:
//   dcd:
// }`

// const ast = [
//   {
//     categ: "interface",
//     name: "Abc",
//     properties: [
//       {
//         name: "ab",
//         type: "string"
//       }
//     ]
//   }
// ]

const ast = parseTypeOnlyToAst(test)
console.log(JSON.stringify(ast, undefined, 2))
