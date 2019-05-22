const { TypeOnlyParserListener } = require("../antlr-parser/TypeOnlyParserListener")

const stringDelim = ["'", "\"", "`"]

class AstExtractor extends TypeOnlyParserListener {

  enterDeclarations(ctx) {
    this.childTypes = new Map()
    this.ast = {
      declarations: []
    }
    // console.log("enter declarations", ctx.getText())
  }

  exitDeclarations(ctx) {
    // console.log("exit declarations", ctx.getText())
    this.checkMissingChildren()
  }

  enterNamedInterface(ctx) {
    this.currentNamedInterface = {
      whichDeclaration: "interface",
      whichType: "interface",
      name: ctx.Identifier().getText(),
    }
    if (ctx.Export())
      namedType.exported = true
    if (ctx.interfaceExtends()) {
      const names = Object.values(ctx.interfaceExtends().typeName()).map(child => child.getText())
      this.currentNamedInterface.extends = names
    }

    // console.log("enter interface", ctx.getText())
  }

  exitNamedInterface(ctx) {
    this.ast.declarations.push(this.currentNamedInterface)
    if (this.interfaceStack.length > 0)
      throw new Error("InterfaceStack should be empty")

    // console.log("exit interface", ctx.getText())
    this.checkMissingChildren()
  }


  enterAnonymousInterface(ctx) {
    if (!this.interfaceStack)
      this.interfaceStack = []
    if (this.interfaceStack.length === 0 && this.currentNamedInterface)
      this.interfaceStack.push(this.currentNamedInterface)
    else {
      const interf = {
        whichType: "interface",
      }
      this.interfaceStack.push(interf)

      this.registerAstChild(interf, ctx.parentCtx)
    }
    // console.log("enter anoInterface", ctx.parentCtx.getText())
  }

  exitAnonymousInterface(ctx) {
    if (this.interfaceStack.length === 0)
      throw new Error("InterfaceStack should not be empty")
    this.interfaceStack.pop()
  }


  // AstNamedType
  enterNamedType(ctx) {
    const namedType = {
      whichDeclaration: "type",
      name: ctx.Identifier().getText(),
    }
    if (ctx.Export())
      namedType.exported = true
    this.currentNamedType = namedType

    this.setAstChildRegistration(type => namedType.type = type, ctx.aType())

    // console.log("enter namedType decl", ctx.getText())
  }

  exitNamedType(ctx) {
    this.ast.declarations.push(this.currentNamedType)
    // console.log("exit namedType decl", ctx.getText())
    this.checkMissingChildren()
  }

  // AstProperty
  enterProperty(ctx) {
    if (!this.interfaceStack || this.interfaceStack.length === 0)
      throw new Error("Missing interfaceStack")

    const current = this.interfaceStack[this.interfaceStack.length - 1]
    const optional = !!ctx.QuestionMark()
    const readonly = !!ctx.ReadOnly()

    const property = {
      whichEntry: "property",
      name: ctx.propertyName().getText(),
      optional,
      readonly
    }
    if (!current.entries)
      current.entries = []
    current.entries.push(property)

    this.setAstChildRegistration(type => property.type = type, ctx.aType())

    // console.log("enter property", this.namedTypeStack.length)
  }

  exitProperty(ctx) {

    // console.log("exit property", this.namedTypeStack.length)
  }

  // TODO: enterCompositeType to manage it
  enterLiteral(ctx) {
    const literal = {
      whichType: "literal",
      value: eval(ctx.getText())
    }
    const firstChar = ctx.getText()[0]
    if (stringDelim.includes(firstChar)) {
      literal.stringDelim = firstChar
    }
    this.registerAstChild(literal, ctx.parentCtx)
    // console.log("enter literal", ctx.parentCtx.getText())
  }

  enterAType(ctx) {
    if (ctx.OpenBracket()) {
      console.log("## open bracket -> function type")
      this.processFunctionType(ctx)
    }
  }

  processFunctionType(ctx) {
    // console.log("====>", ctx.getText(), "===")
    const functionType = {
      whichType: "function",
    }

    this.registerAstChild(functionType, ctx)

    const functionParameters = ctx.functionParameter()
    for (const param of functionParameters) {
      this.setAstChildRegistration(type => {
        if (!functionType.parameters)
          functionType.parameters = []
        functionType.parameters.push({
          name: param.Identifier().getText(),
          type
        })
      }, param.aType())
    }

    this.setAstChildRegistration(child => {
      functionType.returnValue = child
    }, ctx.aType()[0])

    // console.log("enter function type", ctx.aType().getText())
  }

  enterTypeWithParenthesis(ctx) {
    // const functionType = {
    //   whichType: "function",
    //   parameters: [],
    // }

    // this.registerAstChild(functionType, ctx.parentCtx)

    // const functionParameters = ctx.functionParameter()
    // for (const param of functionParameters) {
    //   this.setAstChildRegistration(type => {
    //     functionType.parameters.push({
    //       name: param.Identifier().getText(),
    //       type
    //     })
    //   }, param.aType())
    // }

    // this.setAstChildRegistration(child => {
    //   functionType.returnValue = child
    // }, ctx.aType())
    // let test
    // if (ctx.aType().functionType() !== null) {
    //   test = ctx.aType().functionType().aType().getText()
    // }
    // if(ctx.aType().typeWithParenthesis().)
    // console.log("enter type with parenthesis", ctx.children[1].getText())
  }

  enterFunctionProperty(ctx) {
    if (!this.interfaceStack || this.interfaceStack.length === 0)
      throw new Error("Missing interfaceStack")

    const current = this.interfaceStack[this.interfaceStack.length - 1]
    const optional = !!ctx.QuestionMark()
    const readonly = !!ctx.ReadOnly()

    const functionProperty = {
      whichEntry: "functionProperty",
      name: ctx.propertyName().getText(),
      type: {
        whichType: "function",
      },
      optional,
      readonly
    }
    // this.registerAstChild(functionProperty, ctx.parentCtx)

    const functionParameters = ctx.functionParameter()
    for (const param of functionParameters) {
      this.setAstChildRegistration(type => {
        if (!functionProperty.type.parameters)
          functionProperty.type.parameters = []
        functionProperty.type.parameters.push({
          name: param.Identifier().getText(),
          type
        })
      }, param.aType())
    }
    if (!current.entries)
      current.entries = []
    current.entries.push(functionProperty)

    this.setAstChildRegistration(child => {
      functionProperty.type.returnValue = child
    }, ctx.aType())
  }


  registerAstChild(astType, aType) {
    const cb = this.childTypes.get(aType)
    if (!cb)
      throw new Error(`Unexpected child type: ${aType.getText()} ==== ${cb}`)
    cb(astType)
    this.childTypes.delete(aType)
  }

  setAstChildRegistration(cb, aType) {
    if (this.childTypes.has(aType))
      throw new Error(`Child type already defined for: ${aType.getText()}`)
    this.childTypes.set(aType, cb)
    if (aType.Identifier())
      this.registerAstChild(aType.getText(), aType)
  }

  checkMissingChildren() {
    const missingChildren = Array.from(this.childTypes.keys()).length
    if (missingChildren > 0)
      throw new Error(`Missing children: ${missingChildren}`)
  }
}

exports.AstExtractor = AstExtractor