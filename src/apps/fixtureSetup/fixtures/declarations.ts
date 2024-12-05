import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

export async function generateDeclarations(): Promise<Fixture[]> {
  return [
    {
      filename: "declaration1.ts",
      content: "export declare const API_URL: string;",
    },
    {
      filename: "declaration2.ts",
      content: "export declare function fetchData(url: string): Promise<any>;",
    },
  ];
}
