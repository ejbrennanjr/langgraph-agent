import { Node as TSMorphNode, SyntaxKind } from "ts-morph";
import { TypeScriptNodeTypes } from "@/libs/typescript-graph/domain/TypeScriptNode";

/**
 * Determines the TypeScriptNodeType for a given ts-morph Node.
 *
 * @param node - The ts-morph Node to interpret.
 * @returns The TypeScriptNodeTypes enum value representing the entity type.
 * @throws {Error} If the node kind is unrecognized.
 */
export function getEntityType(node: TSMorphNode): TypeScriptNodeTypes {
  switch (node.getKind()) {
    case SyntaxKind.ClassDeclaration:
      return TypeScriptNodeTypes.Class;
    case SyntaxKind.Constructor:
      return TypeScriptNodeTypes.Constructor;
    case SyntaxKind.Decorator:
      return TypeScriptNodeTypes.Decorator;
    case SyntaxKind.EnumDeclaration:
      return TypeScriptNodeTypes.Enum;
    case SyntaxKind.FunctionDeclaration:
    case SyntaxKind.ArrowFunction:
    case SyntaxKind.FunctionExpression:
      return TypeScriptNodeTypes.Function;
    case SyntaxKind.GetAccessor:
      return TypeScriptNodeTypes.Getter;
    case SyntaxKind.InterfaceDeclaration:
      return TypeScriptNodeTypes.Interface;
    case SyntaxKind.MethodDeclaration:
      return TypeScriptNodeTypes.Method;
    case SyntaxKind.NamespaceImport:
      return TypeScriptNodeTypes.NamespaceImport;
    case SyntaxKind.SourceFile:
      return TypeScriptNodeTypes.Module;
    case SyntaxKind.PropertyDeclaration:
    case SyntaxKind.PropertySignature:
      return TypeScriptNodeTypes.Property;
    case SyntaxKind.SetAccessor:
      return TypeScriptNodeTypes.Setter;
    case SyntaxKind.TypeAliasDeclaration:
      return TypeScriptNodeTypes.Type;
    case SyntaxKind.VariableDeclaration:
      return TypeScriptNodeTypes.Variable;

    default:
      throw new Error(`Unrecognized SyntaxKind: ${node.getKindName()}`);
  }
}
