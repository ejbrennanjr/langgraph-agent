import { getGraphInstance } from "./libs/GraphInterface";

const graph = getGraphInstance();

// PREVIOUS CODE (We will refactor this code)
// import { Project } from "ts-morph";
// import { buildDependencyGraph } from "./graphBuilder";
// import { printDependencyGraph } from "./graphPrinter";

// // Initialize the Project based on the tsconfig.json file
// const project = new Project({
//   tsConfigFilePath:
//     "/Users/edwardbrennan/Workspace/refactor-sample-app/tsconfig.json",
// });

// // Load source files according to the tsconfig.json settings
// const sourceFiles = project.getSourceFiles();
// console.log(`Found ${sourceFiles.length} source files.`);

// // print the source files
// sourceFiles.forEach((file) => {
//   console.log(file.getFilePath());
// });

// if (sourceFiles.length === 0) {
//   console.error(
//     "No source files found. Check your tsconfig.json path and configuration."
//   );
//   process.exit(1);
// }

// // Build the dependency graph
// const graph = buildDependencyGraph(sourceFiles);

// // Print the dependency graph
// printDependencyGraph(graph);

// // Optional: Print dependencies for a specific file or component
// // const specificFile = "/Users/edwardbrennan/Workspace/refactor-sample-app/src/libs/userUtils.ts";
// // printDependencies(graph, specificFile);
