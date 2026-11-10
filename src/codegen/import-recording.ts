import ts from 'typescript';

export type RecordingAction = { code: string; assertion: boolean };
const pageMethods = new Set([
  'goto',
  'getByRole',
  'getByLabel',
  'getByPlaceholder',
  'getByText',
  'getByTestId',
  'getByTitle',
  'getByAltText',
  'locator',
  'frameLocator',
  'filter',
  'nth',
  'first',
  'last',
  'and',
  'or',
  'within',
  'click',
  'dblclick',
  'fill',
  'press',
  'check',
  'uncheck',
  'setChecked',
  'selectOption',
  'hover',
  'focus',
  'blur',
  'clear',
  'type',
  'pressSequentially',
  'toBeVisible',
  'toBeHidden',
  'toBeChecked',
  'toBeEnabled',
  'toBeDisabled',
  'toBeEmpty',
  'toBeFocused',
  'toHaveText',
  'toContainText',
  'toHaveValue',
  'toHaveValues',
  'toHaveCount',
  'toHaveTitle',
  'toHaveURL',
  'toHaveAttribute',
  'toHaveAccessibleName',
  'toHaveAccessibleDescription',
  'not',
]);

export function recordingActions(source: string, baseURL: string): RecordingAction[] {
  const file = ts.createSourceFile(
    'recording.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const diagnostics = (file as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] })
    .parseDiagnostics;
  if (diagnostics.length) throw new Error('Recording contains invalid TypeScript');
  let body: ts.Block | undefined;
  for (const statement of file.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === '@playwright/test'
    )
      continue;
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression))
      throw new Error(
        'Import supports one standard codegen test and optional storageState only. Refactor other declarations manually.',
      );
    const call = statement.expression;
    if (
      ts.isPropertyAccessExpression(call.expression) &&
      call.expression.expression.getText(file) === 'test' &&
      call.expression.name.text === 'use'
    ) {
      const options = call.arguments[0];
      if (
        !options ||
        !ts.isObjectLiteralExpression(options) ||
        options.properties.some(
          (property) =>
            !ts.isPropertyAssignment(property) ||
            property.name.getText(file) !== 'storageState' ||
            !ts.isStringLiteral(property.initializer),
        )
      )
        throw new Error(
          'Only codegen storageState is replaced automatically. Preserve device/viewport options manually.',
        );
      continue;
    }
    if (!ts.isIdentifier(call.expression) || call.expression.text !== 'test' || body)
      throw new Error('Import requires exactly one test(...) call');
    const fn = call.arguments[1];
    if (!fn || !ts.isArrowFunction(fn) || !ts.isBlock(fn.body))
      throw new Error('Expected a standard async codegen test body');
    const binding = fn.parameters[0]?.name;
    if (
      !binding ||
      !ts.isObjectBindingPattern(binding) ||
      binding.elements.length !== 1 ||
      binding.elements[0]?.name.getText(file) !== 'page'
    )
      throw new Error(
        'Import supports the page fixture only. Refactor multi-page/context recordings manually.',
      );
    body = fn.body;
  }
  if (!body || !body.statements.length) throw new Error('Recording contains no actions');
  const actions = body.statements.map((statement) => {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isAwaitExpression(statement.expression) ||
      !ts.isCallExpression(statement.expression.expression)
    )
      throw new Error(
        'Only sequential await page actions and expect assertions are supported. Variables, popups, downloads and control flow need manual steps.',
      );
    const expression = statement.expression.expression;
    const root = expression.getText(file);
    const assertion = root.startsWith('expect(');
    if (!assertion && !root.startsWith('page.'))
      throw new Error('Action must start with page or expect(page...)');
    function validate(node: ts.Node) {
      if (
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node) ||
        ts.isNewExpression(node) ||
        ts.isSpreadElement(node) ||
        ts.isSpreadAssignment(node) ||
        ts.isTemplateExpression(node) ||
        ts.isElementAccessExpression(node)
      )
        throw new Error(
          'Unsupported dynamic recording expression; convert it into a reviewed step manually.',
        );
      if (ts.isPropertyAccessExpression(node) && !pageMethods.has(node.name.text))
        throw new Error(`Unsupported recorded method: ${node.name.text}`);
      if (ts.isIdentifier(node)) {
        const isProperty = ts.isPropertyAccessExpression(node.parent) && node.parent.name === node;
        const isKey = ts.isPropertyAssignment(node.parent) && node.parent.name === node;
        if (!isProperty && !isKey && !['page', 'expect', 'undefined'].includes(node.text))
          throw new Error(`Recording depends on an external value: ${node.text}`);
      }
      ts.forEachChild(node, validate);
    }
    validate(expression);
    // Relative navigation allows the imported scenario to use configured BASE_URL.
    const transformed = ts.transform(statement, [
      (context) => (node) => {
        const visit: ts.Visitor = (current) => {
          if (
            ts.isCallExpression(current) &&
            ts.isPropertyAccessExpression(current.expression) &&
            current.expression.expression.getText(file) === 'page' &&
            current.expression.name.text === 'goto' &&
            current.arguments[0] &&
            ts.isStringLiteral(current.arguments[0])
          ) {
            const target = new URL(current.arguments[0].text, baseURL);
            if (target.origin !== new URL(baseURL).origin)
              throw new Error('Recorded navigation is outside BASE_URL; review it manually.');
            return ts.factory.updateCallExpression(
              current,
              current.expression,
              current.typeArguments,
              [
                ts.factory.createStringLiteral(target.pathname + target.search + target.hash),
                ...current.arguments.slice(1),
              ],
            );
          }
          return ts.visitEachChild(current, visit, context);
        };
        return ts.visitNode(node, visit) as ts.ExpressionStatement;
      },
    ]);
    try {
      return {
        code: ts
          .createPrinter()
          .printNode(ts.EmitHint.Unspecified, transformed.transformed[0]!, file),
        assertion,
      };
    } finally {
      transformed.dispose();
    }
  });
  if (!actions.some((action) => action.assertion))
    throw new Error(
      'Add at least one recorded assertion before importing; actions alone do not verify behavior.',
    );
  return actions;
}

export function renderRecording(name: string, actions: RecordingAction[], guest = false) {
  if (!/^[a-z][a-z0-9-]{0,59}$/.test(name))
    throw new Error('Name must be a lowercase slug beginning with a letter (max 60 characters)');
  const feature = `@ui @generated\nFeature: Recording ${name}\n  # Generated technical steps: review and rename around business behavior.\n  Scenario: Replay ${name}\n${guest ? '' : '    Given I am signed in via the API\n'}${actions.map((action, index) => `    ${action.assertion ? 'Then I verify' : 'When I replay'} recording "${name}" action ${index + 1}`).join('\n')}\n`;
  const steps = `import { expect, type Page } from '@playwright/test';\n\n// Imported from a reviewed codegen recording. Original assertions are preserved.\nexport const actions: ((page: Page) => Promise<void>)[] = [\n${actions.map((action) => `  async (page) => {\n    ${action.code}\n  },`).join('\n')}\n];\n`;
  return { feature, steps };
}
