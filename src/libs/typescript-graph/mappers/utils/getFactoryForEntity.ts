import { TypeScriptNodeTypes } from "@/libs/typescript-graph/domain/TypeScriptNode";
import { CreateNodeFn } from "@/libs/typescript-graph/domain/utils/CreateNodeFn";

// Import all node types
import {
  ClassNode,
  ClassData,
  createClassNode,
} from "@/libs/typescript-graph/domain/ClassNode";
import {
  ConstructorNode,
  ConstructorData,
  createConstructorNode,
} from "@/libs/typescript-graph/domain/ConstructorNode";
import {
  DecoratorNode,
  DecoratorData,
  createDecoratorNode,
} from "@/libs/typescript-graph/domain/DecoratorNode";
import {
  EnumNode,
  EnumData,
  createEnumNode,
} from "@/libs/typescript-graph/domain/EnumNode";
import {
  ExternalImportEntityNode,
  ExternalImportEntityData,
  createExternalImportEntityNode,
} from "@/libs/typescript-graph/domain/ExternalImportEntityNode";
import {
  ExternalModuleNode,
  ExternalModuleData,
  createExternalModuleNode,
} from "@/libs/typescript-graph/domain/ExternalModuleNode";
import {
  FunctionNode,
  FunctionData,
  createFunctionNode,
} from "@/libs/typescript-graph/domain/FunctionNode";
import {
  GetterNode,
  GetterData,
  createGetterNode,
} from "@/libs/typescript-graph/domain/GetterNode";
import {
  InterfaceNode,
  InterfaceData,
  createInterfaceNode,
} from "@/libs/typescript-graph/domain/InterfaceNode";
import {
  MethodNode,
  MethodData,
  createMethodNode,
} from "@/libs/typescript-graph/domain/MethodNode";
import {
  ModuleNode,
  ModuleData,
  createModuleNode,
} from "@/libs/typescript-graph/domain/ModuleNode";
import {
  NamespaceImportNode,
  NamespaceImportData,
  createNamespaceImportNode,
} from "@/libs/typescript-graph/domain/NamespaceImportNode";
import {
  PropertyNode,
  PropertyData,
  createPropertyNode,
} from "@/libs/typescript-graph/domain/PropertyNode";
import {
  SetterNode,
  SetterData,
  createSetterNode,
} from "@/libs/typescript-graph/domain/SetterNode";
import {
  TypeNode,
  TypeData,
  createTypeNode,
} from "@/libs/typescript-graph/domain/TypeNode";
import {
  VariableNode,
  VariableData,
  createVariableNode,
} from "@/libs/typescript-graph/domain/VariableNode";

export type NodeTypeMap = {
  [TypeScriptNodeTypes.Class]: { node: ClassNode; data: ClassData };
  [TypeScriptNodeTypes.Constructor]: {
    node: ConstructorNode;
    data: ConstructorData;
  };
  [TypeScriptNodeTypes.Decorator]: { node: DecoratorNode; data: DecoratorData };
  [TypeScriptNodeTypes.Enum]: { node: EnumNode; data: EnumData };
  [TypeScriptNodeTypes.ExternalImportEntity]: {
    node: ExternalImportEntityNode;
    data: ExternalImportEntityData;
  };
  [TypeScriptNodeTypes.ExternalModule]: {
    node: ExternalModuleNode;
    data: ExternalModuleData;
  };
  [TypeScriptNodeTypes.Function]: { node: FunctionNode; data: FunctionData };
  [TypeScriptNodeTypes.Getter]: { node: GetterNode; data: GetterData };
  [TypeScriptNodeTypes.Interface]: { node: InterfaceNode; data: InterfaceData };
  [TypeScriptNodeTypes.Method]: { node: MethodNode; data: MethodData };
  [TypeScriptNodeTypes.Module]: { node: ModuleNode; data: ModuleData };
  [TypeScriptNodeTypes.NamespaceImport]: {
    node: NamespaceImportNode;
    data: NamespaceImportData;
  };

  [TypeScriptNodeTypes.Property]: { node: PropertyNode; data: PropertyData };
  [TypeScriptNodeTypes.Setter]: { node: SetterNode; data: SetterData };
  [TypeScriptNodeTypes.Type]: { node: TypeNode; data: TypeData };
  [TypeScriptNodeTypes.Variable]: { node: VariableNode; data: VariableData };
};

type NodeForType<T extends TypeScriptNodeTypes> = T extends keyof NodeTypeMap
  ? NodeTypeMap[T]["node"]
  : never;

type DataForType<T extends TypeScriptNodeTypes> = T extends keyof NodeTypeMap
  ? NodeTypeMap[T]["data"]
  : never;

export function getFactoryForEntity<T extends TypeScriptNodeTypes>(
  entityType: T
): CreateNodeFn<NodeForType<T>, DataForType<T>> {
  switch (entityType) {
    case TypeScriptNodeTypes.Class:
      return createClassNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Constructor:
      return createConstructorNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Decorator:
      return createDecoratorNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Enum:
      return createEnumNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.ExternalImportEntity:
      return createExternalImportEntityNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.ExternalModule:
      return createExternalModuleNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Function:
      return createFunctionNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Getter:
      return createGetterNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Interface:
      return createInterfaceNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Method:
      return createMethodNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Module:
      return createModuleNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.NamespaceImport:
      return createNamespaceImportNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Property:
      return createPropertyNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Setter:
      return createSetterNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Type:
      return createTypeNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;
    case TypeScriptNodeTypes.Variable:
      return createVariableNode as unknown as CreateNodeFn<
        NodeForType<T>,
        DataForType<T>
      >;

    default:
      throw new Error(`Unrecognized TypeScript node type: ${entityType}`);
  }
}
