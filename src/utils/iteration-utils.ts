import axios from "axios";
import { getAuthHeader } from "./auth-utils";

/**
 * Resolves the iteration path based on the provided value.
 * @param organization The Azure DevOps organization.
 * @param project The Azure DevOps project.
 * @param token The Azure DevOps personal access token.
 * @param iterationPath The iteration path value ('current', 'next', 'backlog', or a custom value).
 * @returns The resolved iteration path.
 */
export async function resolveIterationPath(
  organization: string,
  project: string,
  token: string | undefined,
  iterationPath: string | (() => string)
): Promise<string> {
  if (typeof iterationPath === "function") {
    return iterationPath();
  }

  const predefinedPaths = ["current", "next", "backlog"];
  if (!predefinedPaths.includes(iterationPath)) {
    return iterationPath; // Custom value
  }

  // Fetch all iterations
  const iterationsResponse = await axios.get(
    `https://dev.azure.com/${organization}/${project}/_apis/work/teamsettings/iterations?api-version=7.0`,
    {
      headers: {
        ...getAuthHeader(token),
      },
    }
  );

  const iterations = iterationsResponse.data.value;

  // Fetch team settings to get the backlog path
  const teamSettingsResponse = await axios.get(
    `https://dev.azure.com/${organization}/${project}/_apis/work/teamsettings?api-version=7.0`,
    {
      headers: {
        ...getAuthHeader(token),
      },
    }
  );

  const backlogPath = teamSettingsResponse.data.backlogIteration?.path;

  const currentIteration = iterations.find(
    (iteration: any) => iteration.attributes.timeFrame === "current"
  );
  const nextIteration = iterations.find(
    (iteration: any) => iteration.attributes.timeFrame === "future"
  );

  switch (iterationPath) {
    case "current":
      return currentIteration?.path || backlogPath || project; // Default to backlog if not found
    case "next":
      return nextIteration?.path || backlogPath || project; // Default to backlog if not found
    case "backlog":
      return backlogPath || project; // Default to root project path if backlog is not explicitly set
    default:
      return project; // Default to root project path
  }
}
