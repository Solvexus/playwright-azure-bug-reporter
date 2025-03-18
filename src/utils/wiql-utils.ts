import axios from "axios";
import { getAuthHeader } from "./auth-utils";

export async function executeWiqlQuery(
  organization: string,
  project: string,
  token: string | undefined,
  query: string
): Promise<any[]> {
  try {
    const wiqlResponse = await axios.post(
      `https://dev.azure.com/${organization}/${project}/_apis/wit/wiql?api-version=7.0`,
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(token),
        },
      }
    );

    const workItems = wiqlResponse.data.workItems;

    if (!workItems.length) return [];

    const ids = workItems.map((item: any) => item.id).join(",");

    const detailsResponse = await axios.get(
      `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems?ids=${ids}&fields=System.Id,System.State&api-version=7.0`,
      {
        headers: {
          ...getAuthHeader(token),
        },
      }
    );

    return detailsResponse.data.value;
  } catch (error: any) {
    throw error;
  }
}
