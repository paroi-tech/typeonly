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
    // console.log("exit defs")
  }

  enterInterfaceDecl(ctx) {
    // const typeName = ctx.Identifier().getText()
    // if (jsKeyWords.has(typeName))
    //   throw new Error(`Reserved word: ${typeName}`)
    const exported = ctx.Export() !== null
    const extds = []
    if (ctx.extend() !== null) {
      const extend = Object.values(ctx.extend().typeName()).map(child => child.getText())
      extds.push(...extend)
    }
    this.currentInterfaceDecl = {
      declarationType: "interface",
      whichType: "interface",
      name: ctx.Identifier().getText(),
      entries: [],
      exported,
      extends: extds
    }
    this.ast.declarations.push(this.currentInterfaceDecl)

    // var text = ""

    // text = ctx.getChild(4).getText()
    // for (var index = 0; index <  ctx.children.length; index++ ) {
    //     if(ctx.children[index].text != null)
    //         text += ctx.children[index].text
    //     else
    //         text += ctx.children[index].getText()
    // }
    // let ty
    // if(ctx.extend().typeName() )
    // en
    // if (ctx.interfaceSimple())


    // const children2 = Object.values(ctx.interfaceSimple().interfaceBody().property()).map(child => child.getText())

    // console.log("enter interface", extds)
  }

  exitInterfaceDecl(ctx) {
    // console.log("exit interface", ctx.getText())
  }

  // enterExtend(ctx) {
  //   const children = Object.values(ctx.typeName()).map(child => child.getText())
  //   this.currentInterfaceDecl.extends.push(...children)
  //   // console.log("enter extends", ctx.getText())
  // }

  // exitExtend(ctx) {
  //   // console.log("exit extends", ctx.getText())
  // }

  enterProperty(ctx) {
    if (this.currentInterfaceDecl !== undefined) {
      const optional = ctx.QuestionMark() !== null
      const readonly = ctx.ReadOnly() !== null
      if (this.currentInterfaceDecl !== undefined) {
        this.currentInterfaceDecl.entries.push({
          entryType: "property",
          name: ctx.propertyName().getText(),
          type: ctx.primitiveType().getText(),
          optional,
          readonly
        })
      }
    }

    if (this.currentTypeDecl !== undefined) {
      const optional = ctx.QuestionMark() !== null
      const readonly = ctx.ReadOnly() !== null
      if (this.currentTypeDecl !== undefined) {
        this.currentTypeDecl.type.entries.push({
          entryType: "property",
          name: ctx.propertyName().getText(),
          type: ctx.primitiveType().getText(),
          optional,
          readonly
        })
      }
    }

    // console.log("enter property", ctx.getText())
  }

  exitProperty(ctx) {
    // console.log("exit property")
  }

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

        this.currentTypeDecl = {
          declarationType: "type",
          name: ctx.Identifier().getText(),
          type: {
            whichType: "literal",
            // value: string | number | boolean | bigint
            // stringDelim?: "\"" | "'" | "`"
            value: eval(ctx.typeType().literal().getText())
          },
          exported
        }
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
  // enterLiteral(ctx) {
  //   console.log("enter literal", ctx.getText())
  // }
  // exitLiteral(ctx) {
  //   console.log("exit literal", ctx.getText())
  // }

  exitTypeDecl(ctx) {
    console.log("exit type decl", ctx.getText())
  }

  enterLiteralSeparator(ctx) {
    console.log("enter literal sep", ctx.getText())
  }
  exitLiteralSeparator(ctx) {
    console.log("exit literal sep", ctx.getText())
  }
  // enterInterfaceSimple(ctx) {
  //   if (this.currentTypeDecl !== undefined) {
  //     this.currentTypeDecl.type.push({
  //       whichType: "interface",
  //       entries: []
  //     })
  //   }
  //   console.log("enter interfaceSimple", ctx.getText())
  // }
  // exitInterfaceSimple(ctx) {
  //   console.log("exit interfaceSimple", ctx.getText())
  // }

  // enterTypeType(ctx) {
  //   const typeType = ctx.getText()
  //   if (typeType.includes("{")) {
  //     if (this.currentTypeDecl !== undefined) {
  //       this.currentTypeDecl.type.push({
  //         whichType: "interface",
  //         entries: []
  //       })
  //     }
  //   } else
  //     this.currentTypeDecl.type.push(...typeType)

  //   console.log("enter typeType", ctx.getText())
  // }
  // exitTypeType(ctx) {
  //   console.log("exit typeType", ctx.getText())
  // }

}

exports.AstExtractor = AstExtractor