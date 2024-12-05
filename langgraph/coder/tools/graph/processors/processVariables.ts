import { SourceFile, VariableDeclaration, Node } from "ts-morph";
import { GraphInterface } from "../libs/GraphInterface";
import { generateNodeId, addNode } from "../utils/nodeUtils";
import { addEdge, EdgeType } from "../utils/edgeUtils";
import { getExportScope } from "../utils/exportUtils";

/**
 * Processes all top-level variable declarations within a given TypeScript source file and adds them to the graph.
 *
 * For each top-level variable in the `sourceFile`, the function:
 *  - Creates a unique node in the `graph` representing the variable.
 *  - Tags each node with details such as `name`, `type`, `scope` (exported or internal), and `declarationType` (const, let, or var).
 *  - Attempts to retrieve and store literal values for `const` variables where possible.
 *  - Links the variable node to the file node with "exports" edges for exported variables and "contains" edges for internal variables.
 *
 * ### Explanation of Variable Scope
 * Variables in TypeScript can be:
 * - **Exported**: If a variable is exported, it becomes part of the module's public API, making it accessible to other modules.
 * - **Internal**: Internal variables are not exported and are only available within the current file/module.
 * - The `scope` attribute helps differentiate between exported and internal variables within the graph.
 *
 * ### Variable Type, Declaration Type, and Initialization Value
 * Each variable can have:
 * - **Type**: A specific type (like a primitive or complex type). This function captures and stores the variable's type in the graph.
 * - **Declaration Type**: The keyword used in the variable declaration (`const`, `let`, or `var`). This metadata helps distinguish immutable values (const) from mutable ones.
 * - **Initialization Value**: If the variable is a `const` and is initialized with a literal (primitive or object), this function attempts to capture that literal value for added context.
 *
 * By capturing these details, the graph can reflect both the structure and the internal/external usage of variables within each module.
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file to process.
 * @param graph - An instance of a Graph from graphlib used to store the nodes and edges representing the variable relationships.
 */
export function processVariables(
  sourceFile: SourceFile,
  graph: GraphInterface
): void {
  const filePath = sourceFile.getFilePath();

  // Retrieve all variable statements and their declarations in the source file
  sourceFile.getVariableStatements().forEach((variableStatement) => {
    variableStatement
      .getDeclarations()
      .forEach((variable: VariableDeclaration) => {
        const variableName = variable.getName();
        const initializer = variable.getInitializer();

        // Ensure we only process top-level variables
        if (variable.getParent().getKindName() === "SourceFile") {
          // Skip variable if it’s initialized as a function expression or arrow function, these are handled in processFunctions processor
          if (
            initializer &&
            (Node.isFunctionExpression(initializer) ||
              Node.isArrowFunction(initializer))
          ) {
            return; // Skip to avoid overlap with processFunctions
          }

          const variableNodeId = generateNodeId(
            "variable",
            variableName,
            filePath
          );
          const scope = getExportScope(variable);

          // Determine the declaration type (const, let, or var)
          const declarationType = variableStatement.getDeclarationKind();

          // Attempt to capture literal values for const variables
          let literalValue;
          if (declarationType === "const" && initializer) {
            if (Node.isLiteralLike(initializer)) {
              literalValue = initializer.getText();
            } else if (Node.isObjectLiteralExpression(initializer)) {
              literalValue = initializer.getText();
            } else if (Node.isArrayLiteralExpression(initializer)) {
              literalValue = initializer.getText();
            }
          }

          // Add the variable node to the graph, with metadata for scope, type, declaration type, and literal value if available
          addNode(graph, variableNodeId, "variable", variableName, scope, {
            varType: variable.getType().getText(),
            declarationType,
            ...(literalValue && { literalValue }),
          });

          // Use "exports" for exported variables and "contains" for internal variables
          const edgeType =
            scope !== "internal" ? EdgeType.Exports : EdgeType.Contains;
          addEdge(graph, filePath, variableNodeId, edgeType);
        }
      });
  });
}
