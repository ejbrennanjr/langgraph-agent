/**
 * @fileoverview TypeScript Module Processor Implementation
 * Processes TypeScript source files into ModuleNodes for the refactoring graph.
 * Responsible for analyzing module structure, imports, and exports while maintaining
 * Clean Architecture boundaries.
 */

import { Project, SourceFile, ImportDeclaration, SyntaxKind } from "ts-morph";
import { IGraph } from "@/libs/graph/repositories/IGraph";
import { IModuleProcessor } from "@/libs/typescript-graph/mappers/factories/IModuleProcessor";
import {
  ModuleNode,
  createModuleNode,
  ModuleKind,
  ModuleData,
  createNamedImport,
  createDefaultImport,
  createNamespaceImport,
} from "@/domain/entities/graph/typescript/ModuleNode";
import {
  TypeScriptNode,
  TypeScriptNodeStatus,
  TypeScriptNodeTypes,
} from "@/domain/entities/graph/typescript/TypeScriptNode";
import { TypeScriptEdge } from "@/domain/entities/graph/typescript/TypeScriptEdge";
import { TypeScriptExportValues } from "@/domain/entities/graph/typescript/TypeScriptFoundations";
import { generateNodeId } from "@/libs/typescript-graph/mappers/xutils/xtypescriptNodeId";
import { getSourceLocation } from "@/libs/typescript-graph/mappers/xutils/xtraversalUtils";

/**
 * ModuleProcessor implements IModuleProcessor to transform TypeScript source files
 * into ModuleNodes within the refactoring graph. It handles:
 * - Module type detection (ES6, Namespace, Ambient)
 * - Import analysis and categorization
 * - Export identification and processing
 * - Graph node management (creation, updates)
 */
export class ModuleProcessor implements IModuleProcessor {
  constructor(
    private graph: IGraph<TypeScriptNode<any>, TypeScriptEdge>,
    private project: Project
  ) {}

  /**
   * Processes a TypeScript source file into a ModuleNode.
   * If the module has already been processed and is in a resolved state,
   * returns the existing node to prevent redundant processing.
   *
   * @param filePath - Path to the TypeScript source file
   * @returns A resolved ModuleNode representing the processed file
   * @throws Error if the file cannot be processed
   */
  process(filePath: string): ModuleNode {
    const sourceFile = this.getOrAddSourceFile(filePath);
    const moduleId = this.generateModuleId(sourceFile);
    const existingNode = this.graph.getNode<ModuleNode>(moduleId);

    if (this.isResolvedModule(existingNode)) {
      return existingNode;
    }

    const moduleData = this.buildModuleData(sourceFile);
    const moduleNode = this.createModuleNode(sourceFile, moduleId, moduleData);

    this.updateGraph(moduleNode, existingNode);
    return moduleNode;
  }

  /**
   * Retrieves or adds a source file to the ts-morph project.
   *
   * @param filePath - Path to the TypeScript file
   * @returns The source file instance
   * @throws Error if the file cannot be accessed or parsed
   */
  private getOrAddSourceFile(filePath: string): SourceFile {
    try {
      return (
        this.project.getSourceFile(filePath) ||
        this.project.addSourceFileAtPath(filePath)
      );
    } catch (error) {
      throw new Error(
        `Failed to process source file: ${filePath}. ${error.message}`
      );
    }
  }

  /**
   * Generates a unique identifier for the module based on its file path and name.
   *
   * @param sourceFile - The source file being processed
   * @returns A unique identifier string for the module
   */
  private generateModuleId(sourceFile: SourceFile): string {
    return generateNodeId(
      sourceFile.getFilePath(),
      TypeScriptNodeTypes.Module,
      sourceFile.getBaseNameWithoutExtension()
    );
  }

  /**
   * Type guard to check if a node is a fully resolved ModuleNode.
   *
   * @param node - The node to check
   * @returns True if the node is a resolved ModuleNode
   */
  private isResolvedModule(node: ModuleNode | undefined): node is ModuleNode {
    return !!node && node.status === TypeScriptNodeStatus.Resolved;
  }

  /**
   * Builds the complete ModuleData structure required by the domain contract.
   *
   * @param sourceFile - The source file to analyze
   * @returns ModuleData conforming to the domain schema
   */
  private buildModuleData(sourceFile: SourceFile): ModuleData {
    return {
      path: sourceFile.getFilePath(),
      moduleKind: this.determineModuleKind(sourceFile),
      imports: this.processImports(sourceFile),
      exports: this.processExports(sourceFile),
    };
  }

  /**
   * Creates a new ModuleNode using the domain factory function.
   *
   * @param sourceFile - The source file being processed
   * @param moduleId - The unique identifier for the module
   * @param moduleData - The processed module data
   * @returns A new ModuleNode instance
   */
  private createModuleNode(
    sourceFile: SourceFile,
    moduleId: string,
    moduleData: ModuleData
  ): ModuleNode {
    return createModuleNode(
      moduleId,
      sourceFile.getBaseNameWithoutExtension(),
      TypeScriptExportValues.Internal,
      TypeScriptNodeStatus.Resolved,
      getSourceLocation(sourceFile),
      sourceFile.getFilePath(),
      moduleData.moduleKind,
      {
        imports: moduleData.imports,
        exports: moduleData.exports,
      }
    );
  }

  /**
   * Updates the graph with the new or updated module node.
   * Handles both new nodes and upgrading placeholder nodes to resolved status.
   *
   * @param moduleNode - The new module node to add or update
   * @param existingNode - The existing node in the graph, if any
   */
  private updateGraph(
    moduleNode: ModuleNode,
    existingNode: ModuleNode | undefined
  ): void {
    if (!existingNode) {
      this.graph.addNode(moduleNode);
    } else if (existingNode.status === TypeScriptNodeStatus.Placeholder) {
      this.graph.updateNode(moduleNode);
    }
  }

  /**
   * Determines the kind of module based on its syntax structure.
   * Analyzes module declarations to identify namespace, ambient, or ES6 modules.
   *
   * @param sourceFile - The source file to analyze
   * @returns The determined ModuleKind
   */
  private determineModuleKind(sourceFile: SourceFile): ModuleKind {
    const hasNamespaces = sourceFile
      .getDescendantsOfKind(SyntaxKind.ModuleDeclaration)
      .some((mod) => mod.getName().includes("."));

    const hasModuleDeclarations = sourceFile
      .getDescendantsOfKind(SyntaxKind.ModuleDeclaration)
      .some((mod) => !mod.getName().includes("."));

    if (hasNamespaces) return ModuleKind.Namespace;
    if (hasModuleDeclarations) return ModuleKind.Ambient;
    return ModuleKind.ES6;
  }

  /**
   * Processes all imports in the source file, categorizing them into
   * named imports, namespace imports, and default imports.
   *
   * @param sourceFile - The source file to analyze
   * @returns Structured import data meeting the domain contract
   */
  private processImports(sourceFile: SourceFile) {
    const imports = {
      named: [] as ReturnType<typeof createNamedImport>[],
      namespaces: [] as ReturnType<typeof createNamespaceImport>[],
      defaults: [] as ReturnType<typeof createDefaultImport>[],
    };

    sourceFile.getImportDeclarations().forEach((importDecl) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      // Process named imports (e.g., import { name } from 'module')
      importDecl.getNamedImports().forEach((named) => {
        imports.named.push(
          createNamedImport(named.getName(), named.getAliasNode()?.getText())
        );
      });

      // Process namespace imports (e.g., import * as name from 'module')
      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        imports.namespaces.push(
          createNamespaceImport(moduleSpecifier, namespaceImport.getText())
        );
      }

      // Process default imports (e.g., import name from 'module')
      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport) {
        imports.defaults.push(
          createDefaultImport(moduleSpecifier, defaultImport.getText())
        );
      }
    });

    return imports;
  }

  /**
   * Processes all exports in the source file, including both named
   * and default exports.
   *
   * @param sourceFile - The source file to analyze
   * @returns Structured export data meeting the domain contract
   */
  private processExports(sourceFile: SourceFile) {
    const exports = {
      named: [] as string[],
      default: undefined as string | undefined,
    };

    // Process named exports (e.g., export { name })
    sourceFile.getExportDeclarations().forEach((exportDecl) => {
      exportDecl.getNamedExports().forEach((named) => {
        exports.named.push(named.getName());
      });
    });

    // Process default export (e.g., export default name)
    const defaultExport = sourceFile.getDefaultExportSymbol();
    if (defaultExport) {
      exports.default = defaultExport.getName();
    }

    return exports;
  }
}
