const { TypeOnlyParserListener } = require("../antlr-parser/TypeOnlyParserListener")

// const jsKeyWords = new Set(["if", "for"])

class AstExtractor extends TypeOnlyParserListener {

  enterDefs(ctx) {
    this.ast = {
      declarations: []
    }
    // console.log("enter defs", ctx.getText())
  }

  exitDefs(ctx) {
    console.log("exit defs", ctx.getText())
  }

  enterNamedInterface(ctx) {
    this.test = []
    // const typeName = ctx.Identifier().getText()
    // if (jsKeyWords.has(typeName))
    //   throw new Error(`Reserved word: ${typeName}`)
    this.currentInterfaces = []
    this.interfaceParams = []
    const exported = ctx.Export() !== null
    const extds = []
    if (ctx.extend() !== null) {
      const extend = Object.values(ctx.extend().typeName()).map(child => child.getText())
      extds.push(...extend)
    }

    const currentNamedInterface = {
      declarationType: "interface",
      whichType: "interface",
      name: ctx.Identifier().getText(),
      entries: [],
      exported,
      extends: extds
    }

    this.currentInterfaces.push(currentNamedInterface)

    const keys = Object.keys(ctx.children).length
    // constObject.keys(ctx).length

    console.log("enter interface", ctx.getText())
  }

  exitNamedInterface(ctx) {
    const decl = this.currentInterfaces.pop()
    this.ast.declarations.push(decl)
    console.log("exit interface", ctx.getText(), Object.keys(this.currentInterfaces.entries).length)
  }

  // AstNamedType
  enterNamedType(ctx) {
    // const reg = /^".*"$|^'.*'$|^`.*`$/
    let lit
    const exported = ctx.Export() !== null
    // const aType = ctx.aType().getText()
    if (ctx.aType() !== null) {
      if (ctx.aType().anonymousInterface() !== null) {
        this.currentNamedType = {
          declarationType: "type",
          name: ctx.Identifier().getText(),
          type: {
            whichType: "interface",
            entries: []
          },
          exported
        }
      } else if (ctx.aType() !== null && ctx.aType().literal() !== null) {
        // const children = Object.values(ctx.aType().literal().literalSeparator()).map(child => child.getText())
        // if (ctx.aType().literal().literalSeparator() !== null)
        //   lit = ctx.aType().literal().literalSeparator().getText()
        // const regStringLimitDoubleQuote = /^".*"$/
        // const regStringLimitSingleQuote = /^'.*'$/
        // const regStringLimitBackQuote = /^`.*`$/
        // const literal = ctx.aType().literal().getText()

        this.currentNamedType = {
          declarationType: "type",
          name: ctx.Identifier().getText(),
          type: {
            whichType: "literal",
            value: eval(ctx.aType().literal().getText())
          },
          exported
        }

        // if (regStringLimitDoubleQuote.test(literal)) {
        //   this.currentnamedType = {
        //     declarationType: "type",
        //     name: ctx.Identifier().getText(),
        //     type: {
        //       whichType: "literal",
        //       stringDelim: "\"",
        //       value: eval(ctx.aType().literal().getText())
        //     },
        //     exported
        //   }
        // } else if (regStringLimitSingleQuote.test(literal)) {
        //   this.currentnamedType = {
        //     declarationType: "type",
        //     name: ctx.Identifier().getText(),
        //     type: {
        //       whichType: "literal",
        //       stringDelim: "'",
        //       value: eval(ctx.aType().literal().getText())
        //     },
        //     exported
        //   }
        // } else if (regStringLimitBackQuote.test(literal)) {
        //   this.currentnamedType = {
        //     declarationType: "type",
        //     name: ctx.Identifier().getText(),
        //     type: {
        //       whichType: "literal",
        //       stringDelim: "`",
        //       value: eval(ctx.aType().literal().getText())
        //     },
        //     exported
        //   }
        // } else {
        //   this.currentnamedType = {
        //     declarationType: "type",
        //     name: ctx.Identifier().getText(),
        //     type: {
        //       whichType: "literal",
        //       stringDelim: "",
        //       value: eval(ctx.aType().literal().getText())
        //     },
        //     exported
        //   }
        // }

      } else {
        this.currentNamedType = {
          declarationType: "type",
          name: ctx.Identifier().getText(),
          type: ctx.aType().getText(),
          exported
        }
      }
    }
    this.ast.declarations.push(this.currentNamedType)
    // const children = Object.values(ctx.aType().anonymousInterface().interfaceBody().property()).map(child => child.getText())

    console.log("enter type decl", ctx.getText())
  }

  exitNamedType(ctx) {
    // console.log("exit type decl", ctx.getText())
  }

  enterAnonymousInterface(ctx) {
    // console.log("enter interface Simple", ctx.getText())
  }

  exitAnonymousInterface(ctx) {
    // console.log("exit interface Simple", ctx.getText())
  }


  // AstProperty
  enterProperty(ctx) {
    if (!!this.currentInterfaces) {
      const cur = this.currentInterfaces[this.currentInterfaces.length - 1]
      const optional = !!ctx.QuestionMark()
      const readonly = !!ctx.ReadOnly()

      if (!!ctx.aType().anonymousInterface()) {
        cur.entries.push({
          entryType: "property",
          name: ctx.propertyName().getText(),
          type: {
            whichType: "interface",
            entries: []
          },
          optional,
          readonly
        })
      } else if (!!ctx.aType().functionType()) {
        if (ctx.aType().functionType().params() !== undefined) {
          cur.entries.push({
            entryType: "property",
            name: ctx.propertyName().getText(),
            type: {
              whichType: "function",
              parameters: this.interfaceParams,
              returnValue: ctx.aType().functionType().Identifier().getText()
            },
            optional,
            readonly
          })
        } else {
          cur.entries.push({
            entryType: "property",
            name: ctx.propertyName().getText(),
            type: {
              whichType: "function",
              parameters: [],
              returnValue: ctx.aType().functionType().Identifier().getText()
            },
            optional,
            readonly
          })
        }
      } else {
        cur.entries.push({
          entryType: "property",
          name: ctx.propertyName().getText(),
          type: ctx.aType().getText(),
          optional,
          readonly
        })
      }
    }

    // this.test = {
    //   current : ctx.propertyName().getText(),
    //   child :
    // }

    // console.log("enter property", ctx.parentCtx.getText())
    console.log("enter property", ctx.getText())
  }

  exitProperty(ctx) {

    console.log("exit property", ctx.propertyName().getText())
  }

  enterFunctionProperty(ctx) {
    const optional = !!ctx.QuestionMark()
    const readonly = !!ctx.ReadOnly()
    const cur = this.currentInterfaces[this.currentInterfaces.length - 1]
    cur.entries.push({
      entryType: "functionProperty",
      name: ctx.propertyName().getText(),
      type: {
        whichType: "function",
        parameters: this.interfaceParams,
        returnValue: ctx.aType().getText()
      },
      optional,
      readonly
    })
  }
  exitFunctionProperty(ctx) { }

  enterParams(ctx) {
    // const cur = this.currentInterfaces[this.currentInterfaces.length - 1]
    this.interfaceParams.push({
      name: ctx.Identifier().getText(),
      type: ctx.aType().getText()
    })
    console.log("enter Params", this.interfaceParams)
  }
  exitParams(ctx) {
  }

}

exports.AstExtractor = AstExtractor