import axios from "axios";
import { getAuthHeader } from "./auth-utils";

export async function createCustomField(
  organization: string,
  project: string,
  token: string | undefined,
  customFieldName: string
) {
  const payload = {
    name: customFieldName.split(".").pop(),
    referenceName: customFieldName,
    type: "string",
    usage: "workItem",
  };

  await axios.post(
    `https://dev.azure.com/${organization}/_apis/wit/fields?api-version=7.0`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(token),
      },
    }
  );

  console.log(`Custom field '${customFieldName}' created successfully.`);
}

export async function checkCustomFieldExists(
  organization: string,
  project: string,
  token: string | undefined,
  customFieldName: string
): Promise<boolean> {
  try {
    const fields = await fetch(
      `https://dev.azure.com/${organization}/_apis/wit/fields?api-version=6.0`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ).then((response) => response.json());

    return fields.value.some(
      (field: { referenceName: string }) =>
        field.referenceName === customFieldName
    );
  } catch (error) {
    console.error("Error checking custom field existence:", error);
    return false;
  }
}
