const { parseTypeOnlyToAst } = require("./parse-typeonly")

const test = `
interface                                                     $_abc12








{





  sd : string




  df:string
}                 interface _$dff
{
  ff:string
  cc:string
}



`

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
