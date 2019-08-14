import test from 'ava';
import llvm from 'llvm-node';
import ts from 'typescript';

test('test llvm add', async t => {
  const source = ts.createSourceFile(
    '',
    'const a = 1 + 1;',
    ts.ScriptTarget.ES2015,
    true,
    ts.ScriptKind.TS
  );

  ts.forEachChild(source, parserNode);

  const context = new llvm.LLVMContext();
  const module = new llvm.Module('add_module', context);

  const mainFn = llvm.Function.create(
    llvm.FunctionType.get(llvm.Type.getVoidTy(context), false),
    llvm.LinkageTypes.ExternalLinkage,
    'main',
    module
  );

  const addFn = llvm.Function.create(
    llvm.FunctionType.get(llvm.Type.getInt32Ty(context), false),
    llvm.LinkageTypes.ExternalLinkage,
    'add',
    module
  );

  const addBlock = llvm.BasicBlock.create(context, 'add_block', addFn);
  const builder = new llvm.IRBuilder(context);
  builder.setInsertionPoint(addBlock);

  const v1 = llvm.ConstantInt.get(context, 1);
  const v2 = llvm.ConstantInt.get(context, 2);
  const returnValue = builder.createAdd(v1, v2);
  builder.createRet(returnValue);

  module.print(); // prints IR
  t.true(true);
});

function parserNode(node: ts.Node): void {
  debug('\n\n', node);
  switch (node.kind) {
    case ts.SyntaxKind.EndOfFileToken:
      return;
  }

  ts.forEachChild(node, parserNode);
}
