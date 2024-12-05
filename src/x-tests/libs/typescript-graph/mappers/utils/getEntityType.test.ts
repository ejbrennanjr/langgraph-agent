// getEntityType.test.ts
import { getEntityType } from "@/libs/typescript-graph/mappers/utils/getEntityType";
import { TypeScriptNodeTypes } from "@/libs/typescript-graph/domain/TypeScriptNode";
import { SyntaxKind, Node as TSMorphNode } from "ts-morph";

describe("getEntityType", () => {
  const mockNode = (kind: SyntaxKind): Partial<TSMorphNode> => ({
    getKind: () => kind,
    getKindName: () => SyntaxKind[kind],
  });

  it.each([
    [SyntaxKind.ClassDeclaration, TypeScriptNodeTypes.Class],
    [SyntaxKind.Constructor, TypeScriptNodeTypes.Constructor],
    [SyntaxKind.Decorator, TypeScriptNodeTypes.Decorator],
    [SyntaxKind.EnumDeclaration, TypeScriptNodeTypes.Enum],
    [SyntaxKind.FunctionDeclaration, TypeScriptNodeTypes.Function],
    [SyntaxKind.ArrowFunction, TypeScriptNodeTypes.Function],
    [SyntaxKind.FunctionExpression, TypeScriptNodeTypes.Function],
    [SyntaxKind.GetAccessor, TypeScriptNodeTypes.Getter],
    [SyntaxKind.InterfaceDeclaration, TypeScriptNodeTypes.Interface],
    [SyntaxKind.MethodDeclaration, TypeScriptNodeTypes.Method],
    [SyntaxKind.NamespaceImport, TypeScriptNodeTypes.NamespaceImport],
    [SyntaxKind.SourceFile, TypeScriptNodeTypes.Module],
    [SyntaxKind.PropertyDeclaration, TypeScriptNodeTypes.Property],
    [SyntaxKind.PropertySignature, TypeScriptNodeTypes.Property],
    [SyntaxKind.SetAccessor, TypeScriptNodeTypes.Setter],
    [SyntaxKind.TypeAliasDeclaration, TypeScriptNodeTypes.Type],
    [SyntaxKind.VariableDeclaration, TypeScriptNodeTypes.Variable],
  ])(
    "should map SyntaxKind.%s to TypeScriptNodeTypes.%s",
    (syntaxKind, expectedNodeType) => {
      const node = mockNode(syntaxKind) as TSMorphNode;
      expect(getEntityType(node)).toBe(expectedNodeType);
    }
  );

  it("should throw an error for unrecognized SyntaxKind", () => {
    const node = mockNode(SyntaxKind.EndOfFileToken) as TSMorphNode; // Unrecognized kind
    expect(() => getEntityType(node)).toThrow(
      `Unrecognized SyntaxKind: ${SyntaxKind[SyntaxKind.EndOfFileToken]}`
    );
  });
});
