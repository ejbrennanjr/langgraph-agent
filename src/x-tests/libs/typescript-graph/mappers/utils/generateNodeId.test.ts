// generateNodeId.test.ts
import { generateNodeId } from "@/libs/typescript-graph/mappers/utils/generateNodeId";
import { TypeScriptNodeTypes } from "@/libs/typescript-graph/domain/TypeScriptNode";

describe("generateNodeId", () => {
  it("should generate a node ID in the correct format", () => {
    const filePath = "/src/user.ts";
    const nodeType = TypeScriptNodeTypes.Class;
    const nodeName = "UserService";

    const result = generateNodeId(filePath, nodeType, nodeName);

    expect(result).toBe("/src/user.ts::class::UserService");
  });

  it("should handle different node types", () => {
    const filePath = "/src/math.ts";
    const nodeType = TypeScriptNodeTypes.Function;
    const nodeName = "calculate";

    const result = generateNodeId(filePath, nodeType, nodeName);

    expect(result).toBe("/src/math.ts::function::calculate");
  });

  it("should handle empty strings for filePath, nodeType, and nodeName", () => {
    const filePath = "";
    const nodeType = TypeScriptNodeTypes.Module;
    const nodeName = "";

    const result = generateNodeId(filePath, nodeType, nodeName);

    expect(result).toBe("::module::");
  });

  it("should handle special characters in filePath and nodeName", () => {
    const filePath = "/src/[user]";
    const nodeType = TypeScriptNodeTypes.Property;
    const nodeName = "property<Value>";

    const result = generateNodeId(filePath, nodeType, nodeName);

    expect(result).toBe("/src/[user]::property::property<Value>");
  });
});
