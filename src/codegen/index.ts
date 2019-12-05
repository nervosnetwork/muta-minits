import llvm from 'llvm-node';
import ts from 'typescript';

import { Stdlib } from '../stdlib';
import * as symtab from '../symtab';
import CodeGenArray from './array-literal-expression';
import CodeGenBinary from './binary-expression';
import CodeGenBoolean from './boolean-literal-expression';
import CodeGenCall from './call-expression';
import CodeGenClassDeclaration from './class-declaration';
import CodeGenCondition from './condition-expression';
import CodeGenDo from './do-statement';
import CodeGenElemAccess from './element-access-expression';
import CodeGenEnum from './enum-declaration';
import CodeGenExport from './export-declaration';
import CodeGenForOf from './for-of-statement';
import CodeGenFor from './for-statement';
import CodeGenFuncDecl from './function-declaration';
import CodeGenGlobalObjectInt8Array from './global-object-int8array';
import CodeGenIf from './if-statement';
import CodeGenModule from './module-declaration';
import CodeGenNew from './new-expression';
import CodeGenNumeric from './numeric-expression';
import CodeGenObject from './object-literal-expression';
import CodeGenPrefixUnary from './prefix-unary-expression';
import CodeGenPropertyAccessExpression from './property-access-expression';
import CodeGenReturn from './return-statement';
import CodeGenString from './string-literal-expression';
import CodeGenVarDecl from './variable-declaration';
import CodeGenWhile from './while-statement';

export default class LLVMCodeGen {
  public readonly program: ts.Program;
  public readonly checker: ts.TypeChecker;

  public readonly builder: llvm.IRBuilder;
  public readonly context: llvm.LLVMContext;
  public readonly module: llvm.Module;
  public readonly symtab: symtab.Symtab;
  public readonly stdlib: Stdlib;

  public readonly cgArray: CodeGenArray;
  public readonly cgBinary: CodeGenBinary;
  public readonly cgBoolean: CodeGenBoolean;
  public readonly cgCall: CodeGenCall;
  public readonly cgClassDeclaration: CodeGenClassDeclaration;
  public readonly cgCondition: CodeGenCondition;
  public readonly cgDo: CodeGenDo;
  public readonly cgElemAccess: CodeGenElemAccess;
  public readonly cgEnum: CodeGenEnum;
  public readonly cgExport: CodeGenExport;
  public readonly cgForOf: CodeGenForOf;
  public readonly cgFor: CodeGenFor;
  public readonly cgFuncDecl: CodeGenFuncDecl;
  public readonly cgInt8Array: CodeGenGlobalObjectInt8Array;
  public readonly cgIf: CodeGenIf;
  public readonly cgModule: CodeGenModule;
  public readonly cgNumeric: CodeGenNumeric;
  public readonly cgObject: CodeGenObject;
  public readonly cgNew: CodeGenNew;
  public readonly cgPrefixUnary: CodeGenPrefixUnary;
  public readonly cgPropertyAccessExpression: CodeGenPropertyAccessExpression;
  public readonly cgReturn: CodeGenReturn;
  public readonly cgString: CodeGenString;
  public readonly cgVarDecl: CodeGenVarDecl;
  public readonly cgWhile: CodeGenWhile;

  public currentBreakBlock: llvm.BasicBlock | undefined;
  public currentContinueBlock: llvm.BasicBlock | undefined;
  public currentFunction: llvm.Function | undefined;
  public currentType: ts.TypeNode | undefined;

  constructor(main: string) {
    this.program = ts.createProgram([main], {});
    this.checker = this.program.getTypeChecker();

    this.context = new llvm.LLVMContext();
    this.module = new llvm.Module('main', this.context);
    this.builder = new llvm.IRBuilder(this.context);
    this.symtab = new symtab.Symtab();
    this.stdlib = new Stdlib(this);

    this.cgArray = new CodeGenArray(this);
    this.cgBinary = new CodeGenBinary(this);
    this.cgBoolean = new CodeGenBoolean(this);
    this.cgCall = new CodeGenCall(this);
    this.cgClassDeclaration = new CodeGenClassDeclaration(this);
    this.cgCondition = new CodeGenCondition(this);
    this.cgDo = new CodeGenDo(this);
    this.cgElemAccess = new CodeGenElemAccess(this);
    this.cgEnum = new CodeGenEnum(this);
    this.cgExport = new CodeGenExport(this);
    this.cgForOf = new CodeGenForOf(this);
    this.cgFor = new CodeGenFor(this);
    this.cgFuncDecl = new CodeGenFuncDecl(this);
    this.cgInt8Array = new CodeGenGlobalObjectInt8Array(this);
    this.cgIf = new CodeGenIf(this);
    this.cgModule = new CodeGenModule(this);
    this.cgNumeric = new CodeGenNumeric(this);
    this.cgObject = new CodeGenObject(this);
    this.cgNew = new CodeGenNew(this);
    this.cgPrefixUnary = new CodeGenPrefixUnary(this);
    this.cgPropertyAccessExpression = new CodeGenPropertyAccessExpression(this);
    this.cgReturn = new CodeGenReturn(this);
    this.cgString = new CodeGenString(this);
    this.cgVarDecl = new CodeGenVarDecl(this);
    this.cgWhile = new CodeGenWhile(this);

    this.currentBreakBlock = undefined;
    this.currentContinueBlock = undefined;
    this.currentFunction = undefined;
    this.currentType = undefined;
  }

  public withFunction(func: llvm.Function, body: () => any): any {
    const a = this.currentFunction;
    this.currentFunction = func;
    const r = body();
    this.currentFunction = a;
    return r;
  }

  public withType(type: ts.TypeNode | undefined, body: () => any): any {
    const a = this.currentType;
    this.currentType = type;
    const r = body();
    this.currentType = a;
    return r;
  }

  public withContinueBreakBlock(c: llvm.BasicBlock, b: llvm.BasicBlock, body: () => any): any {
    const rc = this.currentContinueBlock;
    this.currentContinueBlock = c;
    const rb = this.currentBreakBlock;
    this.currentBreakBlock = b;
    const r = body();
    this.currentContinueBlock = rc;
    this.currentBreakBlock = rb;
    return r;
  }

  public genText(): string {
    return this.module.print();
  }

  public genGlobalVariable(initializer: llvm.Constant): llvm.Value {
    return new llvm.GlobalVariable(
      this.module,
      initializer.type,
      false,
      llvm.LinkageTypes.ExternalLinkage,
      initializer
    );
  }

  public genSourceFile(file: string): void {
    this.program.getSourceFile(file)!.forEachChild(node => {
      switch (node.kind) {
        case ts.SyntaxKind.EndOfFileToken:
          return;
        case ts.SyntaxKind.VariableStatement:
          this.genVariableStatement(node as ts.VariableStatement);
          break;
        case ts.SyntaxKind.FunctionDeclaration:
          this.genFunctionDeclaration(node as ts.FunctionDeclaration);
          break;
        case ts.SyntaxKind.ClassDeclaration:
          this.genClassDeclaration(node as ts.ClassDeclaration);
          break;
        case ts.SyntaxKind.EnumDeclaration:
          this.genEnumDeclaration(node as ts.EnumDeclaration);
          break;
        case ts.SyntaxKind.ExpressionStatement:
          this.genExpressionStatement(node as ts.ExpressionStatement);
          break;
        case ts.SyntaxKind.ModuleDeclaration:
          this.genModuleDeclaration(node as ts.ModuleDeclaration);
          break;
        case ts.SyntaxKind.ExportDeclaration:
          this.genExportDeclaration(node as ts.ExportDeclaration);
          break;
        default:
          throw new Error('Unsupported grammar');
      }
    });

    this.cgFuncDecl.genImplemention();
  }

  public genNumeric(node: ts.NumericLiteral): llvm.ConstantInt {
    return this.cgNumeric.genNumeric(node);
  }

  public genStringLiteral(node: ts.StringLiteral): llvm.Value {
    return this.cgString.genStringLiteral(node);
  }

  public genBoolean(node: ts.BooleanLiteral): llvm.ConstantInt {
    return this.cgBoolean.genBoolean(node);
  }

  public genIdentifier(node: ts.Identifier): llvm.Value {
    const symbol = this.symtab.get(node.getText())! as symtab.Leaf;
    let r = symbol.data;
    for (let i = 0; i < symbol.ptrs; i++) {
      r = this.builder.createLoad(r);
    }
    return r;
  }

  public genType(type: ts.TypeNode): llvm.Type {
    switch (type.kind) {
      case ts.SyntaxKind.VoidKeyword:
        return llvm.Type.getVoidTy(this.context);
      case ts.SyntaxKind.AnyKeyword:
        return llvm.Type.getInt64Ty(this.context);
      case ts.SyntaxKind.BooleanKeyword:
        return llvm.Type.getInt1Ty(this.context);
      case ts.SyntaxKind.NumberKeyword:
        return llvm.Type.getInt64Ty(this.context);
      case ts.SyntaxKind.StringKeyword:
        return llvm.Type.getInt8PtrTy(this.context);
      case ts.SyntaxKind.TypeReference:
        const real = type as ts.TypeReferenceNode;
        if (real.typeName.kind === ts.SyntaxKind.Identifier) {
          const typeName = (real.typeName as ts.Identifier).getText();
          if (typeName === 'Int8Array') {
            return llvm.Type.getInt8PtrTy(this.context);
          }
          const structType = this.module.getTypeByName(typeName);
          if (structType) {
            return structType.getPointerTo();
          }
          const dest = this.symtab.get(typeName);
          if (symtab.isMeso(dest)) {
            for (const v of dest.data.values()) {
              return (v as symtab.Leaf).data.type;
            }
          }
          throw new Error('Unsupported type'); // TODO: impl struct
        }
        throw new Error(`Unsupported type ${type.getText()}`);
      case ts.SyntaxKind.TypeLiteral:
        return this.cgObject.genObjectLiteralType(type as ts.TypeLiteralNode);
      case ts.SyntaxKind.ArrayType:
        const elementType = this.genType((type as ts.ArrayTypeNode).elementType);
        return elementType.getPointerTo();
      default:
        throw new Error(`Unsupported type ${type.kind}`);
    }
  }

  public genBlock(node: ts.Block): void {
    node.statements.forEach(b => {
      this.genStatement(b);
    });
  }

  public genExpression(expr: ts.Expression): llvm.Value {
    switch (expr.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return this.genNumeric(expr as ts.NumericLiteral);
      case ts.SyntaxKind.StringLiteral:
        return this.genStringLiteral(expr as ts.StringLiteral);
      case ts.SyntaxKind.Identifier:
        return this.genIdentifier(expr as ts.Identifier);
      case ts.SyntaxKind.FalseKeyword:
        return this.genBoolean(expr as ts.BooleanLiteral);
      case ts.SyntaxKind.TrueKeyword:
        return this.genBoolean(expr as ts.BooleanLiteral);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.genArrayLiteral(expr as ts.ArrayLiteralExpression);
      case ts.SyntaxKind.ElementAccessExpression:
        return this.genElementAccess(expr as ts.ElementAccessExpression);
      case ts.SyntaxKind.CallExpression:
        return this.genCallExpression(expr as ts.CallExpression);
      case ts.SyntaxKind.ParenthesizedExpression:
        return this.genParenthesizedExpression(expr as ts.ParenthesizedExpression);
      case ts.SyntaxKind.PrefixUnaryExpression:
        return this.genPrefixUnaryExpression(expr as ts.PrefixUnaryExpression);
      case ts.SyntaxKind.BinaryExpression:
        return this.genBinaryExpression(expr as ts.BinaryExpression);
      case ts.SyntaxKind.PropertyAccessExpression:
        return this.genPropertyAccessExpression(expr as ts.PropertyAccessExpression);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.genObjectLiteralExpression(expr as ts.ObjectLiteralExpression);
      case ts.SyntaxKind.NewExpression:
        return this.genNewExpression(expr as ts.NewExpression);
      case ts.SyntaxKind.ConditionalExpression:
        return this.genConditionalExpression(expr as ts.ConditionalExpression);
      default:
        throw new Error('Unsupported expression');
    }
  }

  public genArrayLiteral(node: ts.ArrayLiteralExpression): llvm.Value {
    return this.cgArray.genArrayLiteral(node);
  }

  public genElementAccess(node: ts.ElementAccessExpression): llvm.Value {
    return this.cgElemAccess.genElementAccessExpression(node);
  }

  public genCallExpression(node: ts.CallExpression): llvm.Value {
    return this.cgCall.genCallExpression(node);
  }

  public genParenthesizedExpression(node: ts.ParenthesizedExpression): llvm.Value {
    return this.genExpression(node.expression);
  }

  public genPrefixUnaryExpression(node: ts.PrefixUnaryExpression): llvm.Value {
    return this.cgPrefixUnary.genPrefixUnaryExpression(node);
  }

  public genBinaryExpression(node: ts.BinaryExpression): llvm.Value {
    return this.cgBinary.genBinaryExpression(node);
  }

  public genStatement(node: ts.Statement): llvm.Value | void {
    switch (node.kind) {
      case ts.SyntaxKind.Block: // 219
        return this.genBlock(node as ts.Block);
      case ts.SyntaxKind.VariableStatement: // 220
        return this.genVariableStatement(node as ts.VariableStatement);
      case ts.SyntaxKind.EmptyStatement: // 221
        return;
      case ts.SyntaxKind.ExpressionStatement: // 222
        return this.genExpressionStatement(node as ts.ExpressionStatement);
      case ts.SyntaxKind.IfStatement: // 223
        return this.genIfStatement(node as ts.IfStatement);
      case ts.SyntaxKind.DoStatement: // 224
        return this.genDoStatement(node as ts.DoStatement);
      case ts.SyntaxKind.WhileStatement: // 225
        return this.genWhileStatement(node as ts.WhileStatement);
      case ts.SyntaxKind.ForStatement: // 226
        return this.genForStatement(node as ts.ForStatement);
      case ts.SyntaxKind.ForOfStatement: // 228
        return this.genForOfStatement(node as ts.ForOfStatement);
      case ts.SyntaxKind.ContinueStatement: // 229
        return this.genContinueStatement();
      case ts.SyntaxKind.BreakStatement: // 230
        return this.genBreakStatement();
      case ts.SyntaxKind.ReturnStatement: // 231
        return this.genReturnStatement(node as ts.ReturnStatement);
      case ts.SyntaxKind.FunctionDeclaration: // 240
        return this.genFunctionDeclaration(node as ts.FunctionDeclaration);
      case ts.SyntaxKind.ClassDeclaration: // 241
        this.genClassDeclaration(node as ts.ClassDeclaration);
        return;
      case ts.SyntaxKind.EnumDeclaration: // 244
        return this.genEnumDeclaration(node as ts.EnumDeclaration);
      default:
        throw new Error('Unsupported statement');
    }
  }

  public genVariableDeclaration(node: ts.VariableDeclaration): void {
    this.cgVarDecl.genVariableDeclaration(node);
  }

  public genVariableStatement(node: ts.VariableStatement): void {
    node.declarationList.declarations.forEach(item => {
      this.genVariableDeclaration(item);
    });
  }

  public genExpressionStatement(node: ts.ExpressionStatement): llvm.Value {
    return this.genExpression(node.expression);
  }

  public genContinueStatement(): void {
    this.builder.createBr(this.currentContinueBlock!);
  }

  public genBreakStatement(): void {
    this.builder.createBr(this.currentBreakBlock!);
  }

  public genReturnStatement(node: ts.ReturnStatement): llvm.Value {
    return this.cgReturn.genReturnStatement(node);
  }

  public genIfStatement(node: ts.IfStatement): void {
    return this.cgIf.genIfStatement(node);
  }

  public genDoStatement(node: ts.DoStatement): void {
    return this.cgDo.genDoStatement(node);
  }

  public genWhileStatement(node: ts.WhileStatement): void {
    return this.cgWhile.genWhileStatement(node);
  }

  public genForStatement(node: ts.ForStatement): void {
    return this.cgFor.genForStatement(node);
  }

  public genForOfStatement(node: ts.ForOfStatement): void {
    return this.cgForOf.genForOfStatement(node);
  }

  // 240 ts.SyntaxKind.FunctionDeclaration
  public genFunctionDeclaration(node: ts.FunctionDeclaration): void {
    return this.cgFuncDecl.genFunctionDeclaration(node);
  }

  public genClassDeclaration(node: ts.ClassDeclaration): llvm.StructType {
    return this.cgClassDeclaration.genClassDeclaration(node);
  }

  public genEnumDeclaration(node: ts.EnumDeclaration): void {
    return this.cgEnum.genEnumDeclaration(node);
  }

  // 245 SyntakKind.ModuleDeclaration
  public genModuleDeclaration(node: ts.ModuleDeclaration): void {
    return this.cgModule.genModuleDeclaration(node);
  }

  public genExportDeclaration(node: ts.ExportDeclaration): void {
    return this.cgExport.genExportDeclaration(node);
  }

  public genPropertyAccessExpression(node: ts.PropertyAccessExpression): llvm.Value {
    return this.cgPropertyAccessExpression.genPropertyAccessExpression(node);
  }

  public genPropertyAccessExpressionPtr(node: ts.PropertyAccessExpression): llvm.Value {
    return this.cgClassDeclaration.genPropertyAccessExpressionPtr(node);
  }

  public genObjectLiteralExpression(node: ts.ObjectLiteralExpression): llvm.Value {
    return this.cgObject.genObjectLiteralExpression(node);
  }

  public genNewExpression(node: ts.NewExpression): llvm.Value {
    return this.cgNew.genNewExpression(node);
  }

  public genConditionalExpression(node: ts.ConditionalExpression): llvm.Value {
    return this.cgCondition.genConditionalExpression(node);
  }
}
