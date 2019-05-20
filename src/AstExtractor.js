const { TypeOnlyParserListener } = require("../antlr-parser/TypeOnlyParserListener")

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
    const exported = ctx.Export() !== null
    const interfaceExtends = []
    if (ctx.interfaceExtends() !== null) {
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
    this.interfaceStack = []

    // console.log("enter interface", ctx.getText())
  }
  exitNamedInterface(ctx) {
    // const decl = this.currentInterfaces.pop()
    // this.ast.declarations.push(decl)

    this.ast.declarations.push(this.currentNamedInterface)

    if (this.interfaceStack.length > 0)
      throw new Error("InterfaceStack should be empty")

    // console.log("exit interface", ctx.getText())
  }


  enterAnonymousInterface(ctx) {
    if (this.interfaceStack) {
      if (this.interfaceStack.length === 0) {
        this.interfaceStack.push(this.currentNamedInterface)
      } else {
        const interf = {
          whichType: "interface",
          entries: []
        }
        this.interfaceStack.push(interf)

        this.callNextType(interf)
      }
    }

    if (this.namedTypeStack) {
      if (this.namedTypeStack.length === 0) {
        this.namedTypeStack.push(this.currentNamedType)
      } else {
        const interf = {
          whichType: "interface",
          entries: []
        }
        this.namedTypeStack.push(interf)

        this.callNextType(interf)
      }
    }

    // console.log("enter interface Simple", ctx.getText())
  }
  exitAnonymousInterface(ctx) {
    if (this.interfaceStack) {
      if (this.interfaceStack.length === 0)
        throw new Error("InterfaceStack should not be empty")
      this.interfaceStack.pop()
    }


    if (this.namedTypeStack) {
      if (this.namedTypeStack.length === 0)
        throw new Error("NamedStack should not be empty")
      this.namedTypeStack.pop()
    }


    // console.log("exit interface Simple", ctx.getText())
  }


  // AstNamedType
  enterNamedType(ctx) {
    // this.currentNamedInterface = {
    //   declarationType: "interface",
    //   whichType: "interface",
    //   name: ctx.Identifier().getText(),
    //   entries: [],
    //   exported,
    //   extends: interfaceExtends
    // }
    // this.interfaceStack = []

    const exported = ctx.Export() !== null
    const namedType = {
      declarationType: "type",
      name: ctx.Identifier().getText(),
      exported
    }

    if (ctx.aType().anonymousInterface()) {
      // If NamedInterface property type is an anonymousInterface
      this.namedTypeStack = []
      namedType.type = {
        whichType: "interface",
        entries: [],
      }
      this.currentNamedType = namedType
      // this.namedTypeStack.push(this.currentNamedType)

    } else if (ctx.aType().functionType()) {
      // If NamedInterface property type is a functionType
      this.namedTypeStack = []
      namedType.type = {
        entryType: "property",
        name: ctx.propertyName().getText(),
        type: {
          whichType: "function",
          parameters: this.functionParameters,
          returnValue: ctx.aType().functionType().Identifier().getText()
        }
      }
      this.currentNamedType = namedType

    } else if (ctx.aType().literal()) {
      namedType.type = {
        whichType: "literal",
        value: eval(ctx.aType().literal().getText())
        // stringDelim?: "\"" | "'" | "`"
      }
      this.currentNamedType = namedType
      this.ast.declarations.push(this.currentNamedType)
    } else {
      namedType.type = ctx.aType().Identifier().getText()
      this.currentNamedType = namedType
      this.ast.declarations.push(this.currentNamedType)
    }

    // if (ctx.aType().Identifier()) {
    //   namedType.type = ctx.aType().Identifier().getText()
    //   this.currentNamedType = namedType
    //   this.namedTypeStack.push(this.currentNamedType)
    // }


    // if (ctx.aType().anonymousInterface()) {
    //   namedType.type.push({
    //     whichType: "interface",
    //     entries: []
    //   })
    //   this.currentNamedType = namedType

    // } else if (ctx.aType().functionType()) {
    //   namedType.type.push({
    //     whichType: "function",
    //     parameters: AstParameter[],
    //     returnValue: AstType
    //   })
    //   this.currentNamedType = namedType

    // } else if (ctx.aType().literal()) {
    //   namedType.type.push({
    //     whichType: "literal",
    //     value: eval(ctx.aType().literal().getText()),
    //     // stringDelim?: "\"" | "'" | "`"
    //   })
    //   this.currentNamedType = namedType

    // } else {
    //   this.currentNamedType = {
    //     declarationType: "type",
    //     name: ctx.Identifier().getText(),
    //     type: AstType,
    //     exported
    //   }
    // }


    // if (ctx.aType().anonymousInterface()) {
    //   this.currentNamedType = {
    //     declarationType: "type",
    //     name: ctx.Identifier().getText(),
    //     type: {
    //       whichType: "interface",
    //       entries: []
    //     },
    //     exported
    //   }
    // } else if (ctx.aType().literal()) {
    //   this.currentNamedType = {
    //     declarationType: "type",
    //     name: ctx.Identifier().getText(),
    //     type: {
    //       whichType: "literal",
    //       value: eval(ctx.aType().literal().getText())
    //     },
    //     exported
    //   }

    // } else {
    //   this.currentNamedType = {
    //     declarationType: "type",
    //     name: ctx.Identifier().getText(),
    //     type: ctx.aType().getText(),
    //     exported
    //   }
    // }

    // console.log("enter namedType decl", this.namedTypeStack.length)
  }
  exitNamedType(ctx) {
    if (this.namedTypeStack) {
      this.ast.declarations.push(this.currentNamedType)

      if (this.namedTypeStack.length > 0)
        throw new Error("NamedStack should be empty")
    }

    // console.log("exit namedType decl", ctx.getText())
  }


  // AstProperty
  enterProperty(ctx) {
    if (this.interfaceStack) {
      // If property is NamedInterface property
      const current = this.interfaceStack[this.interfaceStack.length - 1]
      const optional = !!ctx.QuestionMark()
      const readonly = !!ctx.ReadOnly()

      if (ctx.aType().anonymousInterface()) {
        // If NamedInterface property type is an anonymousInterface
        const property = {
          entryType: "property",
          name: ctx.propertyName().getText(),
          optional,
          readonly
        }
        current.entries.push(property)
        // Add property type get from enterAnonymousInterface
        this.setNextType(type => property.type = type)

      } else if (ctx.aType().functionType()) {
        // If NamedInterface property type is a functionType
        current.entries.push({
          entryType: "property",
          name: ctx.propertyName().getText(),
          type: {
            whichType: "function",
            parameters: this.functionParameters,
            returnValue: ctx.aType().functionType().Identifier().getText()
          },
          optional,
          readonly
        })

      } else {
        current.entries.push({
          entryType: "property",
          name: ctx.propertyName().getText(),
          type: ctx.aType().getText(),
          optional,
          readonly
        })
      }
    }

    if (this.namedTypeStack) {
      const current = this.namedTypeStack[this.namedTypeStack.length - 1]
      const optional = !!ctx.QuestionMark()
      const readonly = !!ctx.ReadOnly()

      if (this.namedTypeStack.length === 1) {
        if (ctx.aType().anonymousInterface()) {
          // If NamedInterface property type is an anonymousInterface
          const property = {
            entryType: "property",
            name: ctx.propertyName().getText(),
            optional,
            readonly
          }
          current.type.entries.push(property)
          // Add property type get from enterAnonymousInterface
          this.setNextType(type => property.type = type)

        } else if (ctx.aType().functionType()) {
          // If NamedInterface property type is a functionType
          current.type.entries.push({
            entryType: "property",
            name: ctx.propertyName().getText(),
            type: {
              whichType: "function",
              parameters: this.functionParameters,
              returnValue: ctx.aType().functionType().Identifier().getText()
            },
            optional,
            readonly
          })

        } else {
          current.type.entries.push({
            entryType: "property",
            name: ctx.propertyName().getText(),
            type: ctx.aType().getText(),
            optional,
            readonly
          })
        }

      } else {
        if (ctx.aType().anonymousInterface()) {
          // If NamedInterface property type is an anonymousInterface
          const property = {
            entryType: "property",
            name: ctx.propertyName().getText(),
            optional,
            readonly
          }
          current.entries.push(property)
          // Add property type get from enterAnonymousInterface
          this.setNextType(type => property.type = type)

        } else if (ctx.aType().functionType()) {
          // If NamedInterface property type is a functionType
          current.entries.push({
            entryType: "property",
            name: ctx.propertyName().getText(),
            type: {
              whichType: "function",
              parameters: this.functionParameters,
              returnValue: ctx.aType().functionType().Identifier().getText()
            },
            optional,
            readonly
          })

        } else {
          current.entries.push({
            entryType: "property",
            name: ctx.propertyName().getText(),
            type: ctx.aType().getText(),
            optional,
            readonly
          })
        }
      }

    }

    // console.log("enter property", this.namedTypeStack.length)
  }
  exitProperty(ctx) {

    // console.log("exit property", this.namedTypeStack.length)
  }


  enterFunctionProperty(ctx) {
    const optional = !!ctx.QuestionMark()
    const readonly = !!ctx.ReadOnly()
    const current = this.interfaceStack[this.interfaceStack.length - 1]
    current.entries.push({
      entryType: "functionProperty",
      name: ctx.propertyName().getText(),
      type: {
        whichType: "function",
        parameters: this.functionParameters,
        returnValue: ctx.aType().getText()
      },
      optional,
      readonly
    })
  }
  exitFunctionProperty(ctx) { }


  enterFunctionParameters(ctx) {
    this.functionParameters.push({
      name: ctx.Identifier().getText(),
      type: ctx.aType().getText()
    })
    // console.log("enter Params", this.interfaceParams)
  }
  // exitFunctionParameters(ctx) {
  // }

  callNextType(type) {
    if (!this.nextType)
      throw new Error(`Unexpected type`)
    this.nextType(type)
    this.nextType = undefined
  }

  setNextType(cb) {
    if (this.nextType)
      throw new Error(`Missing type`)
    this.nextType = cb
  }

}

exports.AstExtractor = AstExtractor