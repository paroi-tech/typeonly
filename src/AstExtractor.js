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

  enterInterfaceDecl(ctx) {
    const exported = ctx.Export() !== null
    this.currentInterfaceDecl = {
      declarationType: "interface",
      whichType: "interface",
      name: ctx.Identifier().getText(),
      entries: [],
      exported,
      extends: []
    }
    this.ast.declarations.push(this.currentInterfaceDecl)
    console.log("enter interface", ctx.getText())
  }

  enterExtend(ctx) {
    // this.ast.currentInterfaceDecl.extends.push([
    //   ctx.getText(),
    // ])
    const children = Object.values(ctx.typeName()).map(child => child.getText())
    console.log("enter extends", ctx.getText(), children)
  }

  enterTypeName(ctx) {
    // this.ast.currentInterfaceDecl.extends.push({
    //   types: ctx.Type().getText(),
    // })
    console.log("enter type", ctx.getText())
  }
  exitTypeName(ctx) {
    console.log("exit type", ctx.getText())
  }

  exitExtend(ctx) {
    console.log("exit extends", ctx.getText())
  }

  exitInterfaceDecl(ctx) {
    console.log("exit interface", ctx.getText())
  }

  enterProperty(ctx) {
    this.currentInterfaceDecl.entries.push({
      entryType: "property",
      name: ctx.Identifier().getText(),
      type: ctx.primitiveType().getText()
    })
  }

  exitProperty(ctx) {
  }

}

exports.AstExtractor = AstExtractor