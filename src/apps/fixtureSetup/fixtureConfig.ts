import { generateDeclarations } from "@/apps/fixtureSetup/fixtures/declarations";
import { generateInterfaces } from "@/apps/fixtureSetup/fixtures/interfaces";
import { generateBasicModules } from "@/apps/fixtureSetup/fixtures/modules/basic";
import { generateExternalModules } from "@/apps/fixtureSetup/fixtures/modules/external";
import { generateReExportModules } from "@/apps/fixtureSetup/fixtures/modules/reexports";
import { generateNestedModules } from "@/apps/fixtureSetup/fixtures/modules/nested";
import { generateImportPatterns } from "@/apps/fixtureSetup/fixtures/modules/imports";
import { generateExportEdgeCaseModules } from "@/apps/fixtureSetup/fixtures/modules/exportEdgeCases";
import { generateNamedExportsModules } from "@/apps/fixtureSetup/fixtures/modules/exports";

export const fixtureGenerators = [
  { name: "import-patterns", generator: generateImportPatterns },
  { name: "basic-modules", generator: generateBasicModules },
  { name: "external-modules", generator: generateExternalModules },
  { name: "reexport-modules", generator: generateReExportModules },
  { name: "nested-modules", generator: generateNestedModules },
  { name: "named-exports", generator: generateNamedExportsModules },
  { name: "export-edge-cases", generator: generateExportEdgeCaseModules },
  { name: "declarations", generator: generateDeclarations },
  { name: "interfaces", generator: generateInterfaces },
];
