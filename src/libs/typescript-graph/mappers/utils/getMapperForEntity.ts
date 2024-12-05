import { Node as TSMorphNode } from "ts-morph";
import { TypeScriptNodeTypes } from "@/libs/typescript-graph/domain/TypeScript";
import { getEntityType } from "@/libs/typescript-graph/mappers/utils/getEntityType";

// Import mapper functions for each TypeScriptType
import { mapClass } from "@/libs/typescript-graph/mappers/entity/mapClass";
import { mapConstructor } from "@/libs/typescript-graph/mappers/entity/mapConstructor";
import { mapDecorator } from "@/libs/typescript-graph/mappers/entity/mapDecorator";
import { mapEnum } from "@/libs/typescript-graph/mappers/entity/mapEnum";
import { mapFunction } from "@/libs/typescript-graph/mappers/entity/mapFunction";
import { mapGetter } from "@/libs/typescript-graph/mappers/entity/mapGetter";
import { mapInterface } from "@/libs/typescript-graph/mappers/entity/mapInterface";
import { mapMethod } from "@/libs/typescript-graph/mappers/entity/mapMethod";
import { mapModule } from "@/libs/typescript-graph/mappers/entity/mapModule";
import { mapProperty } from "@/libs/typescript-graph/mappers/entity/mapProperty";
import { mapSetter } from "@/libs/typescript-graph/mappers/entity/mapSetter";
import { mapType } from "@/libs/typescript-graph/mappers/entity/mapType";
import { mapVariable } from "@/libs/typescript-graph/mappers/entity/mapVariable";

/**
 * Maps a ts-morph Node to its corresponding mapper function.
 *
 * @param node - The ts-morph Node to interpret.
 * @returns The mapper function for maping the entity.
 */
export function getMapperForEntity(node: TSMorphNode) {
  const entityType = getEntityType(node);

  switch (entityType) {
    case TypeScriptNodeTypes.Class:
      return mapClass;
    case TypeScriptNodeTypes.Constructor:
      return mapConstructor;
    case TypeScriptNodeTypes.Decorator:
      return mapDecorator;
    case TypeScriptNodeTypes.Enum:
      return mapEnum;
    case TypeScriptNodeTypes.Function:
      return mapFunction;
    case TypeScriptNodeTypes.Getter:
      return mapGetter;
    case TypeScriptNodeTypes.Interface:
      return mapInterface;
    case TypeScriptNodeTypes.Method:
      return mapMethod;
    case TypeScriptNodeTypes.Module:
      return mapModule;
    case TypeScriptNodeTypes.Property:
      return mapProperty;
    case TypeScriptNodeTypes.Setter:
      return mapSetter;
    case TypeScriptNodeTypes.Type:
      return mapType;
    case TypeScriptNodeTypes.Variable:
      return mapVariable;
    default:
      throw new Error(`No mapper function found for type: ${entityType}`);
  }
}
