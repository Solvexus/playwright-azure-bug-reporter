import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { getAuthHeader } from "./auth-utils";

export async function uploadAttachment(
  organization: string,
  project: string,
  token: string | undefined,
  attachment: any
): Promise<string> {
  const fileContent = fs.readFileSync(attachment.path);
  const fileName = path.basename(attachment.path);

  const response = await axios.post(
    `https://dev.azure.com/${organization}/${project}/_apis/wit/attachments?fileName=${encodeURIComponent(
      fileName
    )}&api-version=7.0`,
    fileContent,
    {
      headers: {
        "Content-Type": "application/octet-stream",
        ...getAuthHeader(token),
      },
    }
  );
  return response.data.url;
}

export async function linkAttachmentToBug(
  organization: string,
  project: string,
  token: string | undefined,
  bugId: number,
  attachmentUrl: string,
  attachmentName: string
) {
  await axios.patch(
    `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${bugId}?api-version=7.0`,
    [
      {
        op: "add",
        path: "/relations/-",
        value: {
          rel: "AttachedFile",
          url: attachmentUrl,
          attributes: {
            comment: `Attachment: ${attachmentName}`,
          },
        },
      },
    ],
    {
      headers: {
        "Content-Type": "application/json-patch+json",
        ...getAuthHeader(token),
      },
    }
  );
}
