const { TypeOnlyListener } = require("../antlr-parser/TypeOnlyListener")

// const jsKeyWords = new Set(["if", "for"])

class AstExtractor extends TypeOnlyListener {

  enterDefs(ctx) {
    this.ast = {
      declarations: []
    }
    // console.log("enter defs", ctx.getText())
  }

  exitDefs(ctx) {
    console.log("exit defs", ctx.getText())
  }

  enterInterfaceDecl(ctx) {
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

    const currentInterfaceDecl = {
      declarationType: "interface",
      whichType: "interface",
      name: ctx.Identifier().getText(),
      entries: [],
      exported,
      extends: extds
    }

    this.currentInterfaces.push(currentInterfaceDecl)

    // console.log("enter interface", ctx.getText())
  }

  exitInterfaceDecl(ctx) {
    const decl = this.currentInterfaces.pop()
    this.ast.declarations.push(decl)
    console.log("exit interface", ctx.getText(), Object.keys(this.currentInterfaces.entries).length)
  }

  // AstTypeDeclaration
  enterTypeDecl(ctx) {
    // const reg = /^".*"$|^'.*'$|^`.*`$/
    let lit
    const exported = ctx.Export() !== null
    // const typeType = ctx.typeType().getText()
    if (ctx.typeType() !== null) {
      if (ctx.typeType().interfaceSimple() !== null) {
        this.currentTypeDecl = {
          declarationType: "type",
          name: ctx.Identifier().getText(),
          type: {
            whichType: "interface",
            entries: []
          },
          exported
        }
      } else if (ctx.typeType() !== null && ctx.typeType().literal() !== null) {
        // const children = Object.values(ctx.typeType().literal().literalSeparator()).map(child => child.getText())
        // if (ctx.typeType().literal().literalSeparator() !== null)
        //   lit = ctx.typeType().literal().literalSeparator().getText()
        // const regStringLimitDoubleQuote = /^".*"$/
        // const regStringLimitSingleQuote = /^'.*'$/
        // const regStringLimitBackQuote = /^`.*`$/
        // const literal = ctx.typeType().literal().getText()

        this.currentTypeDecl = {
          declarationType: "type",
          name: ctx.Identifier().getText(),
          type: {
            whichType: "literal",
            value: eval(ctx.typeType().literal().getText())
          },
          exported
        }

        // if (regStringLimitDoubleQuote.test(literal)) {
        //   this.currentTypeDecl = {
        //     declarationType: "type",
        //     name: ctx.Identifier().getText(),
        //     type: {
        //       whichType: "literal",
        //       stringDelim: "\"",
        //       value: eval(ctx.typeType().literal().getText())
        //     },
        //     exported
        //   }
        // } else if (regStringLimitSingleQuote.test(literal)) {
        //   this.currentTypeDecl = {
        //     declarationType: "type",
        //     name: ctx.Identifier().getText(),
        //     type: {
        //       whichType: "literal",
        //       stringDelim: "'",
        //       value: eval(ctx.typeType().literal().getText())
        //     },
        //     exported
        //   }
        // } else if (regStringLimitBackQuote.test(literal)) {
        //   this.currentTypeDecl = {
        //     declarationType: "type",
        //     name: ctx.Identifier().getText(),
        //     type: {
        //       whichType: "literal",
        //       stringDelim: "`",
        //       value: eval(ctx.typeType().literal().getText())
        //     },
        //     exported
        //   }
        // } else {
        //   this.currentTypeDecl = {
        //     declarationType: "type",
        //     name: ctx.Identifier().getText(),
        //     type: {
        //       whichType: "literal",
        //       stringDelim: "",
        //       value: eval(ctx.typeType().literal().getText())
        //     },
        //     exported
        //   }
        // }

      } else {
        this.currentTypeDecl = {
          declarationType: "type",
          name: ctx.Identifier().getText(),
          type: ctx.typeType().getText(),
          exported
        }
      }
    }
    this.ast.declarations.push(this.currentTypeDecl)
    // const children = Object.values(ctx.typeType().interfaceSimple().interfaceBody().property()).map(child => child.getText())

    console.log("enter type decl", ctx.getText())
  }

  exitTypeDecl(ctx) {
    // console.log("exit type decl", ctx.getText())
  }

  enterInterfaceSimple(ctx) {
    // console.log("enter interface Simple", ctx.getText())
  }

  exitInterfaceSimple(ctx) {
    // console.log("exit interface Simple", ctx.getText())
  }


  // AstProperty
  enterProperty(ctx) {
    if (!!this.currentInterfaces) {
      const cur = this.currentInterfaces[this.currentInterfaces.length - 1]
      const optional = !!ctx.QuestionMark()
      const readonly = !!ctx.ReadOnly()

      if (!!ctx.typeType().interfaceSimple()) {
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
      } else if (!!ctx.typeType().functionType()) {
        if (ctx.typeType().functionType().params() !== undefined) {
          cur.entries.push({
            entryType: "property",
            name: ctx.propertyName().getText(),
            type: {
              whichType: "function",
              parameters: this.interfaceParams,
              returnValue: ctx.typeType().functionType().Identifier().getText()
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
              returnValue: ctx.typeType().functionType().Identifier().getText()
            },
            optional,
            readonly
          })
        }
      } else {
        cur.entries.push({
          entryType: "property",
          name: ctx.propertyName().getText(),
          type: ctx.typeType().getText(),
          optional,
          readonly
        })
      }
    }

    // console.log("enter property", ctx.getText())
  }

  exitProperty(ctx) {

    // console.log("exit property", ctx.getText())
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
        returnValue: ctx.typeType().getText()
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
      type: ctx.typeType().getText()
    })
    console.log("enter Params", this.interfaceParams)
  }
  exitParams(ctx) {
  }

}

exports.AstExtractor = AstExtractor