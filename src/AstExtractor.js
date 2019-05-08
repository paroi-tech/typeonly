const { TypeOnlyListener } = require("../antlr-parser/TypeOnlyListener")

class AstExtractor extends TypeOnlyListener {

  enterDefs(ctx) {
    this.ast = {
      declarations: []
    }
    console.log("enter defs")
  }

  exitDefs(ctx) {
    console.log("exit defs")
  }

  enterInterfac(ctx) {
    this.currentInterfaceDecl = {
      declarationType: "interface",
      whichType: "interface",
      name: ctx.name().getText(),
      entries: []
    }
    this.ast.declarations.push(this.currentInterfaceDecl)
    console.log("enter interface", ctx.getText())
  }

  exitInterfac(ctx) {
    console.log("exit interface", ctx.getText())
  }

  enterProperty(ctx) {
    this.currentInterfaceDecl.entries.push({
      entryType: "property",
      name: ctx.name().getText(),
      type: ctx.primitiveType().getText()
    })
  }

  exitProperty(ctx) {
  }

}

exports.AstExtractor = AstExtractor