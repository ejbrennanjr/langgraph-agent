import { promises as fs } from "fs";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Utility function to load the Swagger file
async function loadSwaggerFile(filepath: string): Promise<any> {
  try {
    const fileContent = await fs.readFile(filepath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading Swagger file from ${filepath}:`, error);
    throw new Error(`Failed to load or parse Swagger file: ${error.message}`);
  }
}

// LangGraph.js Tool to load and parse a Swagger file
export const loadSwaggerFileTool = tool(
  async ({ filepath }) => {
    console.log("--- loadSwaggerFileTool ---");
    try {
      const swaggerObject = await loadSwaggerFile(filepath);
      console.log("Swagger file loaded successfully");
      return JSON.stringify(swaggerObject, null, 2);
    } catch (e: any) {
      console.warn("Error loading Swagger file:", e.message);
      return `An error occurred while loading the Swagger file: ${e.message}`;
    }
  },
  {
    name: "load_swagger_file",
    description:
      "Loads and parses a Swagger (OpenAPI) JSON file from a specified path, returning the parsed content as a JSON string.",
    schema: z.object({
      filepath: z
        .string()
        .describe(
          "The path to the Swagger JSON file to load and parse. Example: './shortcut-info/swagger.json'"
        ),
    }),
  }
);

// Utility function to list files in a directory with default to current directory
async function listFilesInDirectory(
  directoryPath: string = "./"
): Promise<string[]> {
  try {
    const files = await fs.readdir(directoryPath);
    return files;
  } catch (error) {
    console.error(`Error listing files in ${directoryPath}:`, error);
    throw new Error(`Failed to list files in directory: ${error.message}`);
  }
}

// LangGraph.js Tool to list directory contents
export const listDirectoryContentsTool = tool(
  async ({ directoryPath = "./" }) => {
    console.log("--- listDirectoryContentsTool ---");
    try {
      const files = await listFilesInDirectory(directoryPath);
      console.log("Directory contents listed successfully");
      return JSON.stringify(files, null, 2);
    } catch (e: any) {
      console.warn("Error listing directory contents:", e.message);
      return `An error occurred while listing directory contents: ${e.message}`;
    }
  },
  {
    name: "list_directory_contents",
    description:
      "Lists all files and folders in a specified directory. Defaults to the current directory if none is provided. Returns the names as a JSON array.",
    schema: z.object({
      directoryPath: z
        .string()
        .optional()
        .default("./")
        .describe(
          "The path of the directory to list. Defaults to './' for the current directory."
        ),
    }),
  }
);
