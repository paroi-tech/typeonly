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
      name: ctx.IDENTIFIER().getText(),
    }
    if (ctx.EXPORT())
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
      name: ctx.IDENTIFIER().getText(),
    }
    if (ctx.EXPORT())
      namedType.exported = true
    this.currentNamedType = namedType

    this.setAstChildRegistration(type => namedType.type = type, ctx.aType())

    console.log("enter namedType decl", ctx.getText())
  }

  exitNamedType(ctx) {
    this.ast.declarations.push(this.currentNamedType)
    console.log("exit namedType decl", ctx.getText())
    this.checkMissingChildren()
  }

  // AstProperty
  enterProperty(ctx) {
    if (!this.interfaceStack || this.interfaceStack.length === 0)
      throw new Error("Missing interfaceStack")

    const current = this.interfaceStack[this.interfaceStack.length - 1]
    const optional = !!ctx.QUESTION_MARK()
    const readonly = !!ctx.READ_ONLY()

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

  enterTupleType(ctx) {
    const tupleType = {
      whichType: "tuple",
      itemTypes: []
    }
    this.registerAstChild(tupleType, ctx.parentCtx)

    const itemTypes = ctx.aType()
    itemTypes.forEach((itemType, index) => {
      this.setAstChildRegistration(
        astType => {
          tupleType.itemTypes[index] = astType
        },
        itemType
      )
    })
    console.log("enter Tuple type", ctx.getText())
  }

  enterGenericType(ctx) {
    if (ctx.IDENTIFIER().getText() === "Array" && ctx.aType().length === 1) {
      const arrayType = {
        whichType: "array"
      }
      this.registerAstChild(arrayType, ctx.parentCtx)
      this.setAstChildRegistration(
        astType => {
          arrayType.itemType = astType

        }, ctx.aType()[0])

    } else {
      const genericType = {
        whichType: "generic",
        name: ctx.IDENTIFIER().getText(),
      }
      this.registerAstChild(genericType, ctx.parentCtx)

      const parameters = ctx.aType()
      if (parameters !== null) {
        parameters.forEach((param, index) => {
          this.setAstChildRegistration(
            astType => {
              if (!genericType.parameters)
                genericType.parameters = []
              genericType.parameters[index] = astType
            },
            param
          )
        })
      }
    }

    console.log("enter generic type", ctx.getText())
  }

  enterAType(ctx) {
    if (ctx.OPEN_BRACKET()) {
      console.log("## open bracket -> function type== ", ctx.getText())
      this.processFunctionType(ctx)
    } else if (ctx.UNION() || ctx.INTERSECTION()) {
      this.processCompositeType(ctx)
    } else if (ctx.OPEN_HOOK()) {
      this.processArrayType(ctx)
      console.log("enter ArrayType", ctx.aType()[0].getText())
    }
  }

  processArrayType(ctx) {
    const arrayType = {
      whichType: "array"
    }
    this.registerAstChild(arrayType, ctx)
    this.setAstChildRegistration(
      astType => {
        arrayType.itemType = astType

      }, ctx.aType()[0])
  }

  processCompositeType(ctx) {
    const compositeType = {
      whichType: "composite",
      op: ctx.INTERSECTION() ? "intersection" : "union",
      types: []
    }
    const aTypes = ctx.aType()
    aTypes.forEach((aType, index) => {
      console.log("### enter iteration, index:", index, "for:", ctx.getText())
      this.setAstChildRegistration(
        astType => {
          compositeType.types[index] = astType
          console.log("### register child of composite, index:", index, "for:", ctx.getText())
        },
        aType
      )
      console.log("### end of iteration, index:", index, "for:", ctx.getText())
    })
    this.registerAstChild(compositeType, ctx)

    console.log("## CompositeType === ", aTypes.map(child => child.getText()).join(", "))
    console.log("## CompositeType == ", ctx.getText(), "ast== ", compositeType)
  }

  processFunctionType(ctx) {
    // console.log("====>", ctx.getText(), "===")
    const functionType = {
      whichType: "function",
    }

    this.registerAstChild(functionType, ctx)

    const functionParameters = ctx.functionParameter()
    functionParameters.forEach((param, index) => {
      this.setAstChildRegistration(
        astType => {
          if (!functionType.parameters)
            functionType.parameters = []
          functionType.parameters[index] = {
            name: param.IDENTIFIER().getText(),
            type: astType
          }
        },
        param.aType()
      )
    })

    this.setAstChildRegistration(child => {
      functionType.returnValue = child
    }, ctx.aType()[0])

    // console.log("enter function type", ctx.aType().getText())
  }

  enterTypeWithParenthesis(ctx) {
    this.setAstChildRegistration(child => {
      this.registerAstChild(child, ctx.parentCtx)
    }, ctx.aType())

    console.log("enter type with parenthesis", ctx.getText())
  }

  enterFunctionProperty(ctx) {
    if (!this.interfaceStack || this.interfaceStack.length === 0)
      throw new Error("Missing interfaceStack")

    const current = this.interfaceStack[this.interfaceStack.length - 1]
    const optional = !!ctx.QUESTION_MARK()
    const readonly = !!ctx.READ_ONLY()

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
    functionParameters.forEach((param, index) => {
      this.setAstChildRegistration(
        astType => {
          if (!functionProperty.type.parameters)
            functionProperty.type.parameters = []
          functionProperty.type.parameters[index] = {
            name: param.IDENTIFIER().getText(),
            type: astType
          }
        },
        param.aType()
      )
    })

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
    if (aType.IDENTIFIER())
      this.registerAstChild(aType.getText(), aType)
  }

  checkMissingChildren() {
    const missingChildren = Array.from(this.childTypes.keys()).length
    if (missingChildren > 0)
      throw new Error(`Missing children: ${missingChildren}`)
  }
}

exports.AstExtractor = AstExtractor