const { TypeOnlyParserListener } = require("../antlr-parser/TypeOnlyParserListener")

const stringDelim = ["'", "\"", "`"]

class AstExtractor extends TypeOnlyParserListener {

  enterDeclarations(ctx) {
    this.ast = {
      declarations: []
    }
    // console.log("enter declarations", ctx.getText())
  }

  exitDeclarations(ctx) {
    // console.log("exit declarations", ctx.getText())
  }

  enterNamedInterface(ctx) {
    this.functionParameters = []
    const exported = !!ctx.Export()
    const interfaceExtends = []
    if (ctx.interfaceExtends()) {
      const names = Object.values(ctx.interfaceExtends().typeName()).map(child => child.getText())
      interfaceExtends.push(...names)
    }
    this.currentNamedInterface = {
      declarationType: "interface",
      whichType: "interface",
      name: ctx.Identifier().getText(),
      entries: [],
      exported,
      extends: interfaceExtends
    }

    // console.log("enter interface", ctx.getText())
  }
  exitNamedInterface(ctx) {
    this.ast.declarations.push(this.currentNamedInterface)
    if (this.interfaceStack.length > 0)
      throw new Error("InterfaceStack should be empty")

    // console.log("exit interface", ctx.getText())
  }


  enterAnonymousInterface(ctx) {
    if (!this.interfaceStack)
      this.interfaceStack = []
    if (this.interfaceStack.length === 0 && this.currentNamedInterface)
      this.interfaceStack.push(this.currentNamedInterface)
    else {
      const interf = {
        whichType: "interface",
        entries: []
      }
      this.interfaceStack.push(interf)

      this.callNextType(interf)
    }
  }

  exitAnonymousInterface(ctx) {
    if (this.interfaceStack.length === 0)
      throw new Error("InterfaceStack should not be empty")
    this.interfaceStack.pop()
  }


  // AstNamedType
  enterNamedType(ctx) {

    const exported = !!ctx.Export()
    const namedType = {
      declarationType: "type",
      name: ctx.Identifier().getText(),
      exported
    }
    this.currentNamedType = namedType

    this.setNextType(type => namedType.type = type, ctx.aType())

    console.log("enter namedType decl")
  }
  exitNamedType(ctx) {
    this.ast.declarations.push(this.currentNamedType)
    // console.log("exit namedType decl", ctx.getText())
  }


  // AstProperty
  enterProperty(ctx) {
    if (!this.interfaceStack || this.interfaceStack.length === 0)
      throw new Error("Missing interfaceStack")

    const current = this.interfaceStack[this.interfaceStack.length - 1]
    const optional = !!ctx.QuestionMark()
    const readonly = !!ctx.ReadOnly()

    const property = {
      entryType: "property",
      name: ctx.propertyName().getText(),
      optional,
      readonly
    }
    current.entries.push(property)

    this.setNextType(type => property.type = type, ctx.aType())

    // console.log("enter property", this.namedTypeStack.length)
  }
  exitProperty(ctx) {

    // console.log("exit property", this.namedTypeStack.length)
  }

  enterLiteral(ctx) {
    const literal = {
      whichType: "literal",
      value: eval(ctx.getText())
    }
    const firstChar = ctx.getText()[0]
    if (stringDelim.includes(firstChar)) {
      literal.stringDelim = firstChar
    }
    this.callNextType(literal)

  }

  enterFunctionType(ctx) {
    this.functionParameters = []
    const functionType = {
      whichType: "function",
      parameters: this.functionParameters,
      // TODO: A revoir
      returnValue: ctx.Identifier().getText()
    }
    this.callNextType(functionType)
  }


  enterFunctionParameters(ctx) {
    if (this.functionParameters) {
      this.functionParameters.push({
        name: ctx.Identifier().getText(),
        type: ctx.aType().getText()
      })
    }
  }

  enterFunctionProperty(ctx) {
    this.functionParameters = []
    if (!this.interfaceStack || this.interfaceStack.length === 0)
      throw new Error("Missing interfaceStack")

    const current = this.interfaceStack[this.interfaceStack.length - 1]
    const optional = !!ctx.QuestionMark()
    const readonly = !!ctx.ReadOnly()

    const functionProperty = {
      entryType: "functionProperty",
      name: ctx.propertyName().getText(),
      type: {
        whichType: "function",
        parameters: this.functionParameters,
        returnValue: ctx.aType().getText()
      },
      optional,
      readonly
    }
    current.entries.push(functionProperty)
  }
  exitFunctionProperty(ctx) { }


  callNextType(type) {
    if (!this.nextType)
      throw new Error(`Unexpected type`)
    this.nextType(type)
    this.nextType = undefined
  }

  setNextType(cb, aType) {
    if (this.nextType)
      throw new Error(`Missing type`)
    this.nextType = cb
    if (aType.Identifier())
      this.callNextType(aType.getText())
  }

}

exports.AstExtractor = AstExtractor