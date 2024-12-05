import {
  SourceFile,
  FunctionDeclaration,
  Node,
  VariableDeclaration,
} from "ts-morph";
import { GraphInterface } from "../libs/GraphInterface";
import { generateNodeId, addNode } from "../utils/nodeUtils";
import { addEdge, EdgeType } from "../utils/edgeUtils";
import { getExportScope } from "../utils/exportUtils";

/**
 * Processes all top-level functions within a TypeScript source file and adds them to the graph.
 *
 * This function delegates work to:
 * - `processFunctionDeclarations` to handle standard named function declarations.
 * - `processFunctionVariables` to handle function expressions and arrow functions assigned to variables.
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file to process.
 * @param graph - An instance of a Graph from graphlib used to store the nodes and edges representing the function relationships.
 */
export function processFunctions(
  sourceFile: SourceFile,
  graph: GraphInterface
): void {
  const filePath = sourceFile.getFilePath();

  // Process standard function declarations in the file
  processFunctionDeclarations(sourceFile, filePath, graph);

  // Process variable-based function initializations (function expressions, arrow functions)
  processFunctionVariables(sourceFile, filePath, graph);
}

/**
 * Processes all top-level named function declarations in the source file and adds them to the graph.
 *
 * For each named function declaration:
 * - A unique node is created in the `graph` representing the function, tagged with details such as:
 *   - `name`: The name of the function.
 *   - `parameters`: The names of the function’s parameters.
 *   - `returnType`: The return type of the function, if defined.
 *   - `scope`: Either "named export", "default export", or "internal", depending on whether the function is exported.
 * - An edge links the function node to the file node:
 *   - "exports" for exported functions.
 *   - "contains" for internal functions.
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file to process.
 * @param filePath - The file path where the functions are located, used to identify nodes.
 * @param graph - The graph instance where the function nodes are stored.
 */
function processFunctionDeclarations(
  sourceFile: SourceFile,
  filePath: string,
  graph: GraphInterface
): void {
  sourceFile.getFunctions().forEach((func: FunctionDeclaration) => {
    // Ensure the function is a top-level function within the file
    if (func.getParent().getKindName() === "SourceFile") {
      const functionName = func.getName() || "anonymous";
      const functionNodeId = generateNodeId("function", functionName, filePath);
      const scope = getExportScope(func);

      // Add the function node to the graph with metadata including scope, parameters, and return type
      addNode(graph, functionNodeId, "function", functionName, scope, {
        parameters: func.getParameters().map((param) => param.getName()),
        returnType: func.getReturnType().getText(),
      });

      // Determine the type of edge to link the function to the file, based on its export status
      const edgeType =
        scope !== "internal" ? EdgeType.Exports : EdgeType.Contains;
      addEdge(graph, filePath, functionNodeId, edgeType);
    }
  });
}

/**
 * Processes all top-level variable declarations with function expressions or arrow functions
 * as initializers and adds them to the graph.
 *
 * For each variable declaration with a function initializer:
 * - A unique node is created in the `graph` representing the function, tagged with details such as:
 *   - `name`: The variable name to which the function is assigned.
 *   - `parameters`: The names of the function’s parameters.
 *   - `returnType`: The return type of the function, if defined.
 *   - `scope`: Either "named export", "default export", or "internal", depending on whether the variable is exported.
 * - An edge links the function node to the file node:
 *   - "exports" for exported variables.
 *   - "contains" for internal variables.
 *
 * @param sourceFile - The SourceFile object from ts-morph representing the TypeScript file to process.
 * @param filePath - The file path where the functions are located, used to identify nodes.
 * @param graph - The graph instance where the function nodes are stored.
 */
function processFunctionVariables(
  sourceFile: SourceFile,
  filePath: string,
  graph: GraphInterface
): void {
  sourceFile.getVariableStatements().forEach((variableStatement) => {
    variableStatement
      .getDeclarations()
      .forEach((variable: VariableDeclaration) => {
        // An initializer is the value assigned to the variable (the right side of equal sign), such as a function expression or arrow function
        const initializer = variable.getInitializer();

        // Check if the initializer is a function expression or an arrow function
        if (
          initializer &&
          (Node.isFunctionExpression(initializer) ||
            Node.isArrowFunction(initializer))
        ) {
          const variableName = variable.getName();
          const functionNodeId = generateNodeId(
            "function",
            variableName,
            filePath
          );
          const scope = getExportScope(variable);

          // Add the function initializer node to the graph, capturing metadata for scope, parameters, and return type
          addNode(graph, functionNodeId, "function", variableName, scope, {
            parameters: initializer
              .getParameters()
              .map((param) => param.getName()),
            returnType: initializer.getReturnType().getText(),
          });

          // Link the function node to the file node, using "exports" or "contains" based on export status
          const edgeType =
            scope !== "internal" ? EdgeType.Exports : EdgeType.Contains;
          addEdge(graph, filePath, functionNodeId, edgeType);
        }
      });
  });
}
