import axios from "axios";

export async function createAreaPathIfNotExists(
  organization: string,
  project: string,
  token: string | undefined,
  areaPath: string
): Promise<void> {
  const areaPathWithoutProject = areaPath.replace(
    new RegExp(`^${project}\\\\`),
    ""
  );
  const segments = areaPathWithoutProject.split("\\");
  let currentPath = "";

  for (const segment of segments) {
    const parentPath = currentPath;
    currentPath = currentPath ? `${currentPath}\\${segment}` : segment;

    const url = parentPath
      ? `https://dev.azure.com/${organization}/${project}/_apis/wit/classificationnodes/areas/${encodeURIComponent(
          parentPath
        )}?api-version=7.0`
      : `https://dev.azure.com/${organization}/${project}/_apis/wit/classificationnodes/areas?api-version=7.0`;

    try {
      await axios.post(
        url,
        { name: segment },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`:${token}`).toString(
              "base64"
            )}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`Created area path segment: ${currentPath}`);
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.warn(
          `Area path segment '${currentPath}' already exists. Skipping.`
        );
        continue;
      }
      console.error(
        `Failed to create area path segment '${currentPath}': ${
          error.response?.statusText || error.message
        }`
      );
      throw new Error("Failed to create area path");
    }
  }
}
