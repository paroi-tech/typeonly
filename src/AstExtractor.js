const { TypeOnlyListener } = require("../../antlr-parser/TypeOnlyListener")

export default class AstExtractor extends TypeOnlyListener {
  ast = {}

  enterProg(ctx) {
    console.log("enter prog")
  }

  exitProg(ctx) {
    console.log("exit prog")
  }

  enterExpr(ctx) {
    console.log("enter expr")
  }

  exitExpr(ctx) {
    console.log("exit expr")
  }
}
