import ts from 'typescript';

import * as common from '../common';
import { StdFunc } from '../stdlib';
import { DepType, NodeDepends } from '../types';

export default class Depends {
  private readonly program: ts.Program;
  private readonly checker: ts.TypeChecker;

  constructor(program: ts.Program) {
    this.program = program;
    this.checker = program.getTypeChecker();
  }

  public genDepends(fileName: string): NodeDepends {
    let main: ts.FunctionDeclaration | null = null;

    this.program.getSourceFile(fileName)!.forEachChild(node => {
      if (ts.isFunctionDeclaration(node)) {
        if (!node.name) {
          return;
        }

        if (node.name!.getText() !== 'main') {
          return;
        }

        if (main) {
          throw new Error('Fuck! You want to define two main functions?');
        }
        main = node;
      }
    });

    if (!main) {
      throw new Error('The main function is required.');
    }

    return this.scanFunc(main!)!;
  }

  private scanFunc(node: ts.FunctionDeclaration, call?: ts.CallExpression): NodeDepends | null {
    const dep: NodeDepends = { self: node, depends: [], hashName: '', depType: DepType.func };

    // If the function is not main,
    // we need to calculate a summary of the function plus
    // the call parameters to ensure that different function calls are generated for different types.
    if (node.name && !call && node.name!.getText() === 'main') {
      dep.hashName = 'main';
      dep.depends = this.genMainParams(node);
    } else if (node.name && call) {
      dep.hashName = common.genFunctionHashWithCall(this.checker, call);
    }

    if (!node.body) {
      return dep;
    }

    dep.depends = dep.depends.concat(this.findDepends(node, dep));

    return dep;
  }

  private genMainParams(node: ts.FunctionDeclaration): NodeDepends[] {
    const deps: NodeDepends[] = [];

    deps.push({
      depType: DepType.retType,
      depends: [],
      hashName: '',
      self: node.type ? node.type : ts.createVoidZero()
    });
    node.parameters.forEach(param => {
      deps.push({
        depType: DepType.paramType,
        depends: [],
        hashName: '',
        self: param.type!
      });
    });

    return deps;
  }

  private scanCallExpression(node: ts.CallExpression): NodeDepends | null {
    // is stdlib?
    if (Object.values(StdFunc).includes(node.expression.getText())) {
      return null;
    }

    const funcDecl = this.checker.getResolvedSignature(node)!.getDeclaration() as ts.FunctionDeclaration;
    return this.scanFunc(funcDecl, node);
  }

  private findDepends(node: ts.Node, currentDep: NodeDepends): NodeDepends[] {
    let deps: NodeDepends[] = [];

    node.forEachChild(subNode => {
      switch (subNode.kind) {
        case ts.SyntaxKind.CallExpression:
          const subHashName = common.genFunctionHashWithCall(this.checker, subNode as ts.CallExpression);
          if (subHashName === currentDep.hashName) {
            break;
          }

          const dep = this.scanCallExpression(subNode as ts.CallExpression);
          if (dep) {
            // Specify the dependency type for the function up front.
            dep.depends = dep.depends.concat(this.genCallExpressionDepends(subNode as ts.CallExpression));
            deps.push(dep);
          }
          break;
        default:
          deps = deps.concat(this.findDepends(subNode, currentDep));
          break;
      }
    });

    return deps;
  }

  private genCallExpressionDepends(node: ts.CallExpression): NodeDepends[] {
    const deps: NodeDepends[] = [];

    // function args type
    node.arguments.forEach(arg => {
      deps.push({ self: this.genExpression(arg), depends: [], hashName: '', depType: DepType.paramType });
    });

    // function return type
    const funcDecl = this.checker.getResolvedSignature(node)!.getDeclaration() as ts.FunctionDeclaration;
    if (funcDecl.type) {
      deps.push({ self: funcDecl.type as ts.Node, depends: [], hashName: '', depType: DepType.retType });
    }

    return deps.filter(dep => dep !== null);
  }

  private genExpression(node: ts.Expression): ts.TypeNode {
    switch (node.kind) {
      case ts.SyntaxKind.Identifier:
        return this.genIdentifier(node as ts.Identifier);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.genObjectTypeLiteral(node as ts.ObjectLiteralExpression);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.genArrayLiteralExpression(node as ts.ArrayLiteralExpression);

      // Enum only support `string` and `number`.
      case ts.SyntaxKind.PropertyAccessExpression:
        const val = this.checker.getConstantValue(node as ts.PropertyAccessExpression);
        if (typeof val === 'string') {
          return this.primitiveToTypeNode(ts.SyntaxKind.StringLiteral);
        }
        return this.primitiveToTypeNode(ts.SyntaxKind.NumericLiteral);
      default:
        return this.primitiveToTypeNode(node.kind);
    }
  }

  private genIdentifier(iden: ts.Identifier): ts.TypeNode {
    const nodeSymbol = this.checker.getSymbolAtLocation(iden)!;
    const varObj = nodeSymbol.valueDeclaration as ts.VariableDeclaration;

    return this.genExpression(varObj.initializer!);
  }

  private genObjectTypeLiteral(node: ts.ObjectLiteralExpression): ts.TypeNode {
    const args: ReadonlyArray<ts.TypeElement> = node.properties.map(p => {
      const parameterType = this.checker.getTypeAtLocation(p);
      const sig = ts.createPropertySignature(
        undefined,
        p.name!,
        undefined,
        this.checker.typeToTypeNode(parameterType),
        undefined
      );
      return sig;
    });

    return ts.createTypeLiteralNode(args);
  }

  private genArrayLiteralExpression(node: ts.ArrayLiteralExpression): ts.TypeNode {
    let typeNode: ts.TypeNode | null = null;
    node.elements.forEach(item => {
      const nextType = this.genExpression(item);
      if (typeNode) {
        // TODO: Need to handle 'const arr = [call(1), 1]'?
        if (typeNode.kind !== nextType.kind) {
          throw new Error('The element types of the array must be consistent.');
        }
      } else {
        typeNode = nextType;
      }
    });

    return ts.createArrayTypeNode(typeNode ? typeNode : ts.createNull());
  }

  private primitiveToTypeNode(kind: ts.SyntaxKind): ts.TypeNode {
    switch (kind) {
      case ts.SyntaxKind.NumericLiteral:
        return ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
      case ts.SyntaxKind.StringLiteral:
        return ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        return ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
      default:
        throw new Error(`Unsupported primitive types ${kind}`);
    }
  }
}
