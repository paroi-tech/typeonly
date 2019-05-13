const { TypeOnlyListener } = require("../antlr-parser/TypeOnlyListener")

class AstExtractor extends TypeOnlyListener {

  enterDefs(ctx) {
    this.ast = {
      declarations: []
    }
    console.log("enter defs", ctx.getText())
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
    console.log("enter interface", ctx.children.length)
  }

  exitInterfaceDecl(ctx) {
    console.log("exit interface", ctx.getText())
  }

  enterExtend(ctx) {
    const children = Object.values(ctx.typeName()).map(child => child.getText())
    this.currentInterfaceDecl.extends.push(...children)
    console.log("enter extends", ctx.getText())
  }

  exitExtend(ctx) {
    console.log("exit extends", ctx.getText())
  }

  enterProperty(ctx) {
    const optional = ctx.QuestionMark() !== null
    const readonly = ctx.ReadOnly() !== null
    this.currentInterfaceDecl.entries.push({
      entryType: "property",
      name: ctx.Identifier().getText(),
      type: ctx.primitiveType().getText(),
      optional,
      readonly
    })
    console.log("enter property", ctx.getText())
  }

  exitProperty(ctx) {
    console.log("exit property")
  }

  enterTypeDecl(ctx) {
    const exported = ctx.Export() !== null
    this.currentTypeDecl = {
      declarationType: "type",
      name: ctx.Identifier().getText(),
      type: ctx.typeType().getText(),
      exported
    }
    this.ast.declarations.push(this.currentTypeDecl)
    console.log("enter type decl", ctx.getText(), ctx.typeType().getText())
  }
  exitTypeDecl(ctx) {
    console.log("exit type decl", ctx.getText())
  }

}

exports.AstExtractor = AstExtractor