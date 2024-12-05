import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

/**
 * Generates interface fixtures for testing.
 *
 * @returns An array of interface fixture objects
 */
export async function generateInterfaces(): Promise<Fixture[]> {
  return [
    {
      filename: "interface1.ts",
      content: `
        export interface User {
          id: string;
          name: string;
          age?: number;
        }
      `,
    },
    {
      filename: "interface2.ts",
      content: `
        export interface Product {
          id: number;
          title: string;
          price: number;
        }
      `,
    },
    {
      filename: "interface3.ts",
      content: `
        export interface ServiceResponse<T> {
          status: "success" | "error";
          data: T;
        }
      `,
    },
  ];
}
