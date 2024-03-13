import { AstArrayType, AstClassicImport, AstCommentable, AstCompositeType, AstFunctionProperty, AstFunctionType, AstGenericInstance, AstGenericParameter, AstImportNamedMember, AstIndexSignature, AstInlineImportType, AstInterface, AstKeyofType, AstLiteralType, AstMappedIndexSignature, AstMemberNameLiteral, AstMemberType, AstNamedInterface, AstNamedType, AstNamespacedImport, AstProperty, AstStandaloneComment, AstStandaloneInterfaceComment, AstTupleType, AstType, TypeOnlyAst } from "../ast"
import { AntlrRuleContext } from "./antlr4-defs"
import CommentGrabber, { CommentParsingContext, GrabbedComment, GrabbedCommentsResult } from "./CommentGrabber"
const TypeOnlyParserListener = require("../../antlr-parser/TypeOnlyParserListener").default

type SetType = (astType: AstType) => void

export default class AstExtractor extends TypeOnlyParserListener {
  ast?: TypeOnlyAst
  private comments: CommentGrabber
  private childTypes = new Map<AntlrRuleContext, SetType>()
  private compositeMap = new Map<AntlrRuleContext, AstCompositeType>()
  private interfaceStack: AstInterface[] = []
  private currentNamedInterface?: AstNamedInterface
  private currentNamedType?: Partial<AstNamedType>

  constructor(parsingContext: CommentParsingContext) {
    super()
    this.comments = new CommentGrabber(parsingContext)
  }

  enterDeclarations(ctx: AntlrRuleContext) {
    this.childTypes = new Map()
    this.compositeMap = new Map()
    this.ast = {}
  }

  exitDeclarations(ctx: AntlrRuleContext) {
    this.addStandaloneCommentsTo(this.comments.grabStandaloneCommentsAfterLast())
    this.checkMissingChildren()
  }

  enterClassicImport(ctx: AntlrRuleContext) {
    const classicImport: AstClassicImport = {
      whichDeclaration: "import",
      whichImport: "classic",
      // tslint:disable-next-line: no-eval
      from: eval(ctx.STRING_LITERAL().getText())
    }
    if (ctx.namedImportContent().namedMember()) {
      const namedMembers = ctx.namedImportContent().namedMember()
      const members: AstImportNamedMember[] = []
      namedMembers.forEach((member: any, index: number) => {
        const mb: AstImportNamedMember = {
          name: member.IDENTIFIER()[0].getText()
        }
        if (member.IDENTIFIER()[1])
          mb.as = member.IDENTIFIER()[1].getText()
        members[index] = mb
      })

      classicImport.namedMembers = members
    }

    if (!this.ast!.declarations)
      this.ast!.declarations = []
    this.ast!.declarations.push(classicImport)
  }

  enterNamespacedImport(ctx: AntlrRuleContext) {
    const namespacedImport: AstNamespacedImport = {
      whichDeclaration: "import",
      whichImport: "namespaced",
      // tslint:disable-next-line: no-eval
      from: eval(ctx.STRING_LITERAL().getText()),
      asNamespace: ctx.IDENTIFIER().getText()
    }

    if (!this.ast!.declarations)
      this.ast!.declarations = []
    this.ast!.declarations.push(namespacedImport)
  }


  enterNamedInterface(ctx: AntlrRuleContext) {
    this.currentNamedInterface = {
      whichDeclaration: "interface",
      whichType: "interface",
      name: ctx.IDENTIFIER().getText(),
    }
    if (ctx.EXPORT())
      this.currentNamedInterface.exported = true
    if (ctx.interfaceExtends()) {
      const names = Object.values(ctx.interfaceExtends().typeName()).map((child: any) => child.getText())
      this.currentNamedInterface.extends = names
    }
    this.proccessGenericParameter(ctx, this.currentNamedInterface)
  }

  exitNamedInterface(ctx: AntlrRuleContext) {
    this.addGrabbedCommentsResultTo(this.comments.grabCommentsOf(ctx), {
      annotate: this.currentNamedInterface!,
    })

    if (!this.ast!.declarations)
      this.ast!.declarations = []
    this.ast!.declarations.push(this.currentNamedInterface!)

    this.currentNamedInterface = undefined
    if (this.interfaceStack.length > 0)
      throw new Error("InterfaceStack should be empty")
    this.checkMissingChildren()
  }

  enterAnonymousInterface(ctx: AntlrRuleContext) {
    if (this.interfaceStack.length === 0 && this.currentNamedInterface)
      this.interfaceStack.push(this.currentNamedInterface)
    else {
      const interf: AstInterface = {
        whichType: "interface",
      }
      this.interfaceStack.push(interf)

      this.registerAstChild(interf, ctx.parentCtx)
    }
  }

  exitAnonymousInterface(ctx: AntlrRuleContext) {
    const interf = this.interfaceStack.pop()
    if (!interf)
      throw new Error("InterfaceStack should not be empty")

    if (interf.entries) {
      let mappedIndexSignatureNb = 0
      let indexSignatureNb = 0
      let otherPropertyNb = 0
      for (const entry of interf.entries) {
        if (entry.whichEntry === "mappedIndexSignature") {
          ++mappedIndexSignatureNb
        }
        if (entry.whichEntry === "indexSignature")
          ++indexSignatureNb
        if (entry.whichEntry !== "indexSignature" && entry.whichEntry !== "mappedIndexSignature") {
          ++otherPropertyNb
        }
      }
      if (mappedIndexSignatureNb > 0) {
        if (this.interfaceStack.length === 0 && this.currentNamedInterface)
          throw new Error("A mapped signature can't be in a named interface")
        if (mappedIndexSignatureNb > 1 || (mappedIndexSignatureNb === 1 && otherPropertyNb > 0)) {
          throw new Error("Synthax Error : An Interface must have one property which is a mappedIndexSignature property")
        }
      }
      if (indexSignatureNb > 1) {
        throw new Error("Synthax Error: An Interface must be have one indexSignature property")
      }
    }

    this.addStandaloneCommentsTo(
      this.comments.grabStandaloneCommentsAfterLast(ctx),
      "interface",
      interf
    )
  }

  enterNamedType(ctx: AntlrRuleContext) {
    const namedType: Partial<AstNamedType> = {
      whichDeclaration: "type",
      name: ctx.IDENTIFIER().getText(),
    }
    if (ctx.EXPORT())
      namedType.exported = true
    this.currentNamedType = namedType

    this.setAstChildRegistration(type => namedType.type = type, ctx.aType())

    this.proccessGenericParameter(ctx, namedType)
  }

  exitNamedType(ctx: AntlrRuleContext) {
    this.addGrabbedCommentsResultTo(this.comments.grabCommentsOf(ctx), {
      annotate: this.currentNamedType!,
    })

    if (!this.ast!.declarations)
      this.ast!.declarations = []
    this.ast!.declarations.push(this.currentNamedType as AstNamedType)

    this.currentNamedType = undefined
    this.checkMissingChildren()
  }

  enterProperty(ctx: AntlrRuleContext) {
    if (this.interfaceStack.length === 0)
      throw new Error("Missing interfaceStack")

    const current = this.interfaceStack[this.interfaceStack.length - 1]
    const optional = !!ctx.QUESTION_MARK()
    const readonly = !!ctx.READONLY()

    const property: Partial<AstProperty> = {
      whichEntry: "property",
      name: ctx.propertyName().getText(),
      optional,
      readonly
    }
    this.addGrabbedCommentsResultTo(this.comments.grabCommentsOf(ctx), {
      annotate: property,
      standaloneBeforeTo: "interface",
      parentInterface: current
    })
    if (!current.entries)
      current.entries = []
    current.entries.push(property as AstProperty)

    this.setAstChildRegistration(type => property.type = type, ctx.aType())
  }


  enterIndexSignature(ctx: AntlrRuleContext) {
    if (this.interfaceStack.length === 0)
      throw new Error("Missing interfaceStack")

    const current = this.interfaceStack[this.interfaceStack.length - 1]
    const optional = !!ctx.QUESTION_MARK()
    const readonly = !!ctx.READONLY()

    const indexSignature: Partial<AstIndexSignature> = {
      whichEntry: "indexSignature",
      keyName: ctx.IDENTIFIER().getText(),
      keyType: ctx.signatureType().getText(),
      optional,
      readonly
    }
    this.addGrabbedCommentsResultTo(this.comments.grabCommentsOf(ctx), {
      annotate: indexSignature,
      standaloneBeforeTo: "interface",
      parentInterface: current
    })
    if (!current.entries)
      current.entries = []
    current.entries.push(indexSignature as AstIndexSignature)

    this.setAstChildRegistration(type => indexSignature.type = type, ctx.aType())
  }

  enterMappedIndexSignature(ctx: AntlrRuleContext) {
    if (this.interfaceStack.length === 0)
      throw new Error("Missing interfaceStack")

    const current = this.interfaceStack[this.interfaceStack.length - 1]
    const optional = !!ctx.QUESTION_MARK()
    const readonly = !!ctx.READONLY()

    const mappedIndexSignature: Partial<AstMappedIndexSignature> = {
      whichEntry: "mappedIndexSignature",
      keyName: ctx.IDENTIFIER().getText(),
      optional,
      readonly
    }
    this.addGrabbedCommentsResultTo(this.comments.grabCommentsOf(ctx), {
      annotate: mappedIndexSignature,
      standaloneBeforeTo: "interface",
      parentInterface: current
    })
    if (!current.entries)
      current.entries = []
    current.entries.push(mappedIndexSignature as AstMappedIndexSignature)

    this.setAstChildRegistration(type => mappedIndexSignature.keyInType = type, ctx.aType()[0])
    this.setAstChildRegistration(type => mappedIndexSignature.type = type, ctx.aType()[1])
  }

  enterLiteral(ctx: AntlrRuleContext) {
    const literal: AstLiteralType = {
      whichType: "literal",
      // tslint:disable-next-line: no-eval
      literal: eval(ctx.getText())
    }
    const firstChar = ctx.getText()[0]
    if (isStringDelim(firstChar)) {
      literal.stringDelim = firstChar
    }
    this.registerAstChild(literal, ctx.parentCtx)
  }

  enterTupleType(ctx: AntlrRuleContext) {
    const tupleType: AstTupleType = {
      whichType: "tuple",
    }

    this.registerAstChild(tupleType, ctx.parentCtx)

    const itemTypes = ctx.aType()
    if (itemTypes.length > 0)
      tupleType.itemTypes = []
    itemTypes.forEach((itemType: AntlrRuleContext, index: number) => {
      this.setAstChildRegistration(
        astType => tupleType.itemTypes![index] = astType,
        itemType
      )
    })
  }

  enterGenericInstance(ctx: AntlrRuleContext) {
    if (ctx.typeName().getText() === "Array" && ctx.aType().length === 1) {
      const arrayType: Partial<AstArrayType> = {
        whichType: "array",
        genericSyntax: true
      }
      this.registerAstChild(arrayType, ctx.parentCtx)
      this.setAstChildRegistration(
        astType => {
          arrayType.itemType = astType

        }, ctx.aType()[0])

    } else {
      const genericInstance: AstGenericInstance = {
        whichType: "genericInstance",
        genericName: ctx.typeName().getText(),
        parameterTypes: []
      }
      this.registerAstChild(genericInstance, ctx.parentCtx)

      const parameters = ctx.aType()
      if (parameters !== null) {
        parameters.forEach((param: AntlrRuleContext, index: number) => {
          this.setAstChildRegistration(
            astType => {
              genericInstance.parameterTypes[index] = astType
            },
            param
          )
        })
      }
    }
  }

  enterAType(ctx: AntlrRuleContext) {
    if (ctx.returnType) {
      this.processFunctionType(ctx)
    } else if (ctx.UNION() || ctx.INTERSECTION()) {
      this.processCompositeType(ctx)
    } else if (ctx.memberParentType) {
      this.processMemberType(ctx)
    } else if (ctx.arrayItemType) {
      this.processArrayType(ctx)
    } else if (ctx.KEYOF()) {
      this.processKeyOf(ctx)
    }
  }

  exitAType(ctx: AntlrRuleContext) {
    if (ctx.UNION() || ctx.INTERSECTION()) {
      this.processEndOfCompositeType(ctx)
    }
  }

  processKeyOf(ctx: AntlrRuleContext) {
    const keyofType: Partial<AstKeyofType> = {
      whichType: "keyof"
    }

    this.registerAstChild(keyofType, ctx)
    this.setAstChildRegistration(
      astType => {
        keyofType.type = astType

      }, ctx.aType()[0])
  }

  processMemberType(ctx: AntlrRuleContext) {
    const memberType: Partial<AstMemberType> = {
      whichType: "member",
    }
    if (ctx.memberName().IDENTIFIER()) {
      memberType.memberName = ctx.memberName().IDENTIFIER().getText()
    } else {
      const memberNameLiteral: AstMemberNameLiteral = {
        // tslint:disable-next-line: no-eval
        literal: eval(ctx.memberName().getText())
      }
      const firstChar = ctx.memberName().getText()[0]
      if (isStringDelim(firstChar))
        memberNameLiteral.stringDelim = firstChar
      memberType.memberName = memberNameLiteral
    }
    this.registerAstChild(memberType, ctx)
    this.setAstChildRegistration(
      astType => { memberType.parentType = astType },
      ctx.memberParentType
    )
  }

  processArrayType(ctx: AntlrRuleContext) {
    const arrayType: Partial<AstArrayType> = {
      whichType: "array"
    }
    this.registerAstChild(arrayType, ctx)
    this.setAstChildRegistration(
      astType => { arrayType.itemType = astType },
      ctx.arrayItemType
    )
  }

  processCompositeType(ctx: AntlrRuleContext) {
    const compositeType: AstCompositeType = {
      whichType: "composite",
      op: ctx.INTERSECTION() ? "intersection" : "union",
      types: []
    }
    const aTypes = ctx.aType()
    aTypes.forEach((aType: AntlrRuleContext, index: number) => {
      this.setAstChildRegistration(
        astType => {
          compositeType.types[index] = astType
        },
        aType
      )
    })
    this.registerAstChild(compositeType, ctx)
    this.compositeMap.set(ctx, compositeType)
  }

  processEndOfCompositeType(ctx: AntlrRuleContext) {
    const compositeType = this.compositeMap.get(ctx)
    if (!compositeType)
      throw new Error("Missing composite type")
    this.compositeMap.delete(ctx)
    const [left, right] = compositeType.types
    if (!right) {
      return
    }

    const mergeLeft = typeof left !== "string" && left.whichType === "composite" && left.op === compositeType.op
    const mergeRight = typeof right !== "string" && right.whichType === "composite" && right.op === compositeType.op
    if (mergeLeft || mergeRight) {
      const types: AstType[] = []
      if (mergeLeft)
        types.push(...(left as AstCompositeType).types)
      else
        types.push(left)
      if (mergeRight)
        types.push(...(right as AstCompositeType).types)
      else
        types.push(right)
      compositeType.types = types
    }
  }

  processFunctionType(ctx: AntlrRuleContext) {
    const functionType: Partial<AstFunctionType> = {
      whichType: "function",
    }

    this.registerAstChild(functionType, ctx)

    const functionParameters = ctx.functionParameter()
    functionParameters.forEach((param: AntlrRuleContext, index: number) => {
      this.setAstChildRegistration(
        astType => {
          if (!functionType.parameters)
            functionType.parameters = []
          functionType.parameters[index] = {
            name: param.IDENTIFIER().getText(),
            type: astType,
            optional: !!param.QUESTION_MARK()
          }
        },
        param.aType()
      )
    })

    this.setAstChildRegistration(child => {
      functionType.returnType = child
    }, ctx.returnType)

    this.proccessGenericParameter(ctx, functionType)
  }

  enterTypeWithParenthesis(ctx: AntlrRuleContext) {
    this.setAstChildRegistration(child => {
      this.registerAstChild(child, ctx.parentCtx)
    }, ctx.aType())
  }

  enterFunctionProperty(ctx: AntlrRuleContext) {
    if (this.interfaceStack.length === 0)
      throw new Error("Missing interfaceStack")

    const current = this.interfaceStack[this.interfaceStack.length - 1]
    const optional = !!ctx.QUESTION_MARK()
    const readonly = !!ctx.READONLY()

    const functionProperty: AstFunctionProperty = {
      whichEntry: "functionProperty",
      name: ctx.propertyName().getText(),
      optional,
      readonly
    }

    const functionParameters = ctx.functionParameter()
    functionParameters.forEach((param: AntlrRuleContext, index: number) => {
      this.setAstChildRegistration(
        astType => {
          if (!functionProperty.parameters)
            functionProperty.parameters = []
          functionProperty.parameters[index] = {
            name: param.IDENTIFIER().getText(),
            type: astType,
            optional: !!param.QUESTION_MARK()
          }
        },
        param.aType()
      )
    })

    this.addGrabbedCommentsResultTo(this.comments.grabCommentsOf(ctx), {
      annotate: functionProperty,
      standaloneBeforeTo: "interface",
      parentInterface: current
    })
    if (!current.entries)
      current.entries = []
    current.entries.push(functionProperty)

    if (ctx.aType()) {
      this.setAstChildRegistration(child => {
        functionProperty.returnType = child
      }, ctx.aType())
    }

    this.proccessGenericParameter(ctx, functionProperty)
  }

  enterInlineImportType(ctx: AntlrRuleContext) {
    const inlineImportType: AstInlineImportType = {
      whichType: "inlineImport",
      // tslint:disable-next-line: no-eval
      from: eval(ctx.stringLiteral().getText()),
      exportedName: ctx.IDENTIFIER().getText()
    }

    this.registerAstChild(inlineImportType, ctx.parentCtx)
  }

  proccessGenericParameter(ctx: AntlrRuleContext, astNode: { generic?: AstGenericParameter[] }) {
    if (ctx.genericParameters()) {
      const generic: AstGenericParameter[] = []
      const genericParameters = ctx.genericParameters().genericParameter()
      genericParameters.forEach((param: AntlrRuleContext, index: number) => {
        generic[index] = {
          name: param.IDENTIFIER().getText()
        }
        if (param.extendsType) {
          this.setAstChildRegistration(astType => {
            generic[index].extendsType = astType
          }, param.extendsType)
        }
        if (param.defaultType) {
          this.setAstChildRegistration(astType => {
            generic[index].defaultType = astType
          }, param.defaultType)
        }
      })

      astNode.generic = generic
    }
  }

  registerAstChild(astType: Partial<AstType>, aType: AntlrRuleContext) {
    const cb = this.childTypes.get(aType)
    if (!cb)
      throw new Error(`Unexpected child type: ${aType.getText()}`)
    cb(astType as AstType)
    this.childTypes.delete(aType)
  }

  setAstChildRegistration(cb: SetType, aType: AntlrRuleContext) {
    if (this.childTypes.has(aType))
      throw new Error(`Child type already defined for: ${aType.getText()}`)
    this.childTypes.set(aType, cb)
    if (aType.typeName() || aType.signatureType())
      this.registerAstChild(aType.getText(), aType)
  }

  checkMissingChildren() {
    if (this.childTypes.size > 0)
      throw new Error(`Missing children: ${this.childTypes.size}`)
    if (this.compositeMap.size > 0)
      throw new Error(`Remaining composite: ${this.compositeMap.size}`)
  }

  addGrabbedCommentsResultTo(result: GrabbedCommentsResult, options: {
    annotate: AstCommentable,
    standaloneBeforeTo?: "interface",
    parentInterface?: AstInterface
  }) {
    const { annotate, standaloneBeforeTo, parentInterface } = options
    if (result.standaloneCommentsBefore)
      this.addStandaloneCommentsTo(result.standaloneCommentsBefore, standaloneBeforeTo, parentInterface)
    if (result.docComment)
      annotate.docComment = result.docComment
    if (result.inlineComments.length > 0)
      annotate.inlineComments = result.inlineComments
  }

  addStandaloneCommentsTo(grabbedComments: GrabbedComment[], to?: "interface", parentInterface?: AstInterface) {
    if (grabbedComments.length === 0)
      return
    if (!to) {
      if (!this.ast!.declarations)
        this.ast!.declarations = []
      this.ast!.declarations.push(...grabbedComments.map(({ text, syntax }) => ({
        whichDeclaration: "comment",
        text,
        syntax
      } as AstStandaloneComment)))
    } else if (to === "interface") {
      if (!parentInterface)
        throw new Error(`Parameter 'parentInterface' is required when 'to' is set to 'interface'`)
      if (!parentInterface.entries)
        parentInterface.entries = []
      parentInterface.entries.push(...grabbedComments.map(({ text, syntax }) => ({
        whichEntry: "comment",
        text,
        syntax
      } as AstStandaloneInterfaceComment)))
    } else
      throw new Error(`Invalid 'to' option: ${to}`)
  }
}

function isStringDelim(char: string): char is "'" | "\"" | "`" {
  return ["'", "\"", "`"].includes(char)
}
