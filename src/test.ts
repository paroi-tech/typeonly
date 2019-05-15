// // export type dfdf = {fd : number, gh: string}
// // type cl = {fd : number, readonly gh: string,}
// // interface interface {
// //   $_ab: interface
// //   dc:number,
// // }
// // interface type extends fd { }
// let ABC
// ABC = "dfd `"
// // String
// type A = ABC
// // string literal
// type B = "A\" ` 'BC"
// type B2 = true
// type B3 = 2n
// type B4 = 12.34
// type B5 = RegExp
// const b5: B5 = /12.34/
// // b5.
// let bbb: B
// bbb = "ABC"

const validLiterals = [`"abc"`, `12`, `2.3`, `false`, `true`]

validLiterals.forEach(literal => {
  console.log(eval(literal))
})