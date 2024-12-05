// getFactoryForEntity.test.ts
import { getFactoryForEntity } from "@/libs/typescript-graph/mappers/utils/getFactoryForEntity";
import { TypeScriptNodeTypes } from "@/libs/typescript-graph/domain/TypeScriptNode";
import { createClassNode } from "@/libs/typescript-graph/domain/ClassNode";
import { createConstructorNode } from "@/libs/typescript-graph/domain/ConstructorNode";
import { createDecoratorNode } from "@/libs/typescript-graph/domain/DecoratorNode";
import { createEnumNode } from "@/libs/typescript-graph/domain/EnumNode";
import { createExternalImportEntityNode } from "@/libs/typescript-graph/domain/ExternalImportEntityNode";
import { createExternalModuleNode } from "@/libs/typescript-graph/domain/ExternalModuleNode";
import { createFunctionNode } from "@/libs/typescript-graph/domain/FunctionNode";
import { createGetterNode } from "@/libs/typescript-graph/domain/GetterNode";
import { createInterfaceNode } from "@/libs/typescript-graph/domain/InterfaceNode";
import { createMethodNode } from "@/libs/typescript-graph/domain/MethodNode";
import { createModuleNode } from "@/libs/typescript-graph/domain/ModuleNode";
import { createNamespaceImportNode } from "@/libs/typescript-graph/domain/NamespaceImportNode";
import { createPropertyNode } from "@/libs/typescript-graph/domain/PropertyNode";
import { createSetterNode } from "@/libs/typescript-graph/domain/SetterNode";
import { createTypeNode } from "@/libs/typescript-graph/domain/TypeNode";
import { createVariableNode } from "@/libs/typescript-graph/domain/VariableNode";

describe("getFactoryForEntity", () => {
  it.each([
    [TypeScriptNodeTypes.Class, createClassNode],
    [TypeScriptNodeTypes.Constructor, createConstructorNode],
    [TypeScriptNodeTypes.Decorator, createDecoratorNode],
    [TypeScriptNodeTypes.Enum, createEnumNode],
    [TypeScriptNodeTypes.ExternalImportEntity, createExternalImportEntityNode],
    [TypeScriptNodeTypes.ExternalModule, createExternalModuleNode],
    [TypeScriptNodeTypes.Function, createFunctionNode],
    [TypeScriptNodeTypes.Getter, createGetterNode],
    [TypeScriptNodeTypes.Interface, createInterfaceNode],
    [TypeScriptNodeTypes.Method, createMethodNode],
    [TypeScriptNodeTypes.Module, createModuleNode],
    [TypeScriptNodeTypes.NamespaceImport, createNamespaceImportNode],
    [TypeScriptNodeTypes.Property, createPropertyNode],
    [TypeScriptNodeTypes.Setter, createSetterNode],
    [TypeScriptNodeTypes.Type, createTypeNode],
    [TypeScriptNodeTypes.Variable, createVariableNode],
  ])(
    "should return the correct factory function for TypeScriptNodeType '%s'",
    (nodeType, expectedFactory) => {
      const factory = getFactoryForEntity(nodeType);
      expect(factory).toBe(expectedFactory);
    }
  );

  it("should throw an error for unrecognized node types", () => {
    expect(() =>
      getFactoryForEntity("UnknownType" as TypeScriptNodeTypes)
    ).toThrow("Unrecognized TypeScript node type: UnknownType");
  });
});
