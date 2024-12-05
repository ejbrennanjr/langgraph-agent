import { fixtureGenerators } from "./src/apps/fixtureSetup/fixtureConfig";
import { Fixture } from "./src/apps/fixtureSetup/types/Fixture";
import { generateFixtureOutputs } from "./src/apps/fixtureSetup/generateFixtures";

async function main() {
  console.log("Starting fixture generation...");

  // Prepare an object to store all generated fixtures
  const allFixtures: Record<string, Fixture[]> = {};

  // Generate all fixtures using the configured generators
  for (const { name, generator } of fixtureGenerators) {
    console.log(`Generating ${name} fixtures...`);
    allFixtures[name] = await generator();
  }

  console.log("All fixtures generated successfully!");

  // Write the generated fixtures to the output directory
  console.log("Writing fixtures to src/x-tests/fixtures...");
  await generateFixtureOutputs(allFixtures);

  console.log("Fixtures written successfully!");
  console.log("Fixture generation complete!");
}

// Handle execution and errors
main().catch((error) => {
  console.error("Error during fixture generation:", error);
  process.exit(1);
});
