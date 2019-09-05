import ts from 'typescript';

import { StdFunc } from '../stdlib';
import { NodeDepends } from '../types';

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

  private scanFunc(node: ts.FunctionDeclaration): NodeDepends | null {
    const dep: NodeDepends = { self: node, depends: [] };
    if (!node.body) {
      return dep;
    }

    dep.depends = this.findDepends(node, dep);

    return dep;
  }

  private scanCallExpression(node: ts.CallExpression): NodeDepends | null {
    // is stdlib?
    if (Object.values(StdFunc).includes(node.expression.getText())) {
      return null;
    }

    const funcDecl = this.checker.getResolvedSignature(node)!.getDeclaration() as ts.FunctionDeclaration;
    return this.scanFunc(funcDecl);
  }

  private findDepends(node: ts.Node, currentDep: NodeDepends): NodeDepends[] {
    let deps: NodeDepends[] = [];

    node.forEachChild(subNode => {
      switch (subNode.kind) {
        case ts.SyntaxKind.CallExpression:
          // Determines whether a function recursive call exists.
          const funcDecl = this.checker.getResolvedSignature(subNode as ts.CallExpression)!.getDeclaration() as ts.Node;
          if (funcDecl === currentDep.self) {
            return;
          }

          const dep = this.scanCallExpression(subNode as ts.CallExpression);
          if (dep) {
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
}
