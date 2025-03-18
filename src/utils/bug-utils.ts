import axios from "axios";
import { getAuthHeader } from "./auth-utils";

export async function createBug(
  organization: string,
  project: string,
  token: string | undefined,
  payload: any[]
): Promise<number> {
  const response = await axios.post(
    `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$Bug?api-version=7.0`,
    payload,
    {
      headers: {
        "Content-Type": "application/json-patch+json",
        ...getAuthHeader(token),
      },
    }
  );
  return response.data.id;
}

export function createBugPayload(
  title: string,
  areaPath: string,
  reproSteps: string,
  customFieldName: string,
  bugSignature: string,
  iterationPath: string,
  severity?: string,
  assignedTo?: string
): any[] {
  const payload = [
    {
      op: "add",
      path: "/fields/System.Title",
      value: title,
    },
    {
      op: "add",
      path: "/fields/System.AreaPath",
      value: areaPath,
    },
    {
      op: "add",
      path: "/fields/Microsoft.VSTS.TCM.ReproSteps",
      value: reproSteps,
    },
    {
      op: "add",
      path: `/fields/${customFieldName}`,
      value: bugSignature,
    },
    {
      op: "add",
      path: "/fields/System.IterationPath",
      value: iterationPath,
    },
  ];

  if (severity) {
    payload.push({
      op: "add",
      path: "/fields/Microsoft.VSTS.Common.Severity",
      value: severity,
    });
  }

  if (assignedTo) {
    payload.push({
      op: "add",
      path: "/fields/System.AssignedTo",
      value: assignedTo,
    });
  }

  return payload;
}
