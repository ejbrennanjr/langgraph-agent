// Function to get workflow states
export async function getWorkflowStates(): Promise<
  { id: number; name: string }[]
> {
  const url = `https://api.app.shortcut.com/api/v3/workflows`;

  // Ensure the API key is defined
  const apiKey = process.env.SHORTCUT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SHORTCUT_API_KEY environment variable");
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Shortcut-Token": apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get workflow states: ${errorText}`);
  }

  const data = await response.json();
  const workflowStates = data.flatMap((workflow: any) =>
    workflow.states.map((state: any) => ({ id: state.id, name: state.name }))
  );
  return workflowStates;
}
