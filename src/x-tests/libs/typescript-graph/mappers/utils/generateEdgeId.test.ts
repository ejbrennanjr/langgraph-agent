// generateEdgeId.test.ts
import { generateEdgeId } from "@/libs/typescript-graph/mappers/utils/generateEdgeId";
import { TypeScriptEdgeRelationshipValues } from "@/libs/typescript-graph/domain/TypeScriptEdge";

describe("generateEdgeId", () => {
  it("should generate an edge ID in the correct format", () => {
    const sourceId = "/src/user.ts::class::UserService";
    const targetId = "/src/base.ts::class::BaseService";
    const relationship = TypeScriptEdgeRelationshipValues.EntityExtends;

    const result = generateEdgeId(sourceId, relationship, targetId);

    expect(result).toBe(
      "/src/user.ts::class::UserService-->entity extends-->/src/base.ts::class::BaseService"
    );
  });

  it("should handle different relationship types", () => {
    const sourceId = "/src/math.ts::module::math";
    const targetId = "/src/utils.ts::module::utils";
    const relationship = TypeScriptEdgeRelationshipValues.ModuleImportsNamed;

    const result = generateEdgeId(sourceId, relationship, targetId);

    expect(result).toBe(
      "/src/math.ts::module::math-->module imports named-->/src/utils.ts::module::utils"
    );
  });

  it("should handle edge cases with empty strings", () => {
    const sourceId = "";
    const targetId = "/src/services.ts::class::AuthService";
    const relationship = TypeScriptEdgeRelationshipValues.EntityUses;

    const result = generateEdgeId(sourceId, relationship, targetId);

    expect(result).toBe(
      "-->entity uses-->/src/services.ts::class::AuthService"
    );
  });

  it("should handle special characters in sourceId and targetId", () => {
    const sourceId = "/src/[user]::class::User<Service>";
    const targetId = "/src/[base]::class::Base<Service>";
    const relationship = TypeScriptEdgeRelationshipValues.EntityImplements;

    const result = generateEdgeId(sourceId, relationship, targetId);

    expect(result).toBe(
      "/src/[user]::class::User<Service>-->entity implements-->/src/[base]::class::Base<Service>"
    );
  });
});
