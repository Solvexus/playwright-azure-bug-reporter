import { executeWiqlQuery } from "./utils/wiql-utils";
import { createBug, createBugPayload } from "./utils/bug-utils";
import {
  uploadAttachment,
  linkAttachmentToBug,
} from "./utils/attachment-utils";
import { resolveIterationPath } from "./utils/iteration-utils";
import {
  checkCustomFieldExists,
  createCustomField,
} from "./utils/custom-field-utils";
import { createAreaPathIfNotExists } from "./utils/area-path-utils";
import type { TestCase, TestResult } from "@playwright/test/reporter";
import { BugCreationPolicy } from "./reporter-config";
import * as crypto from "crypto";

export class BugPoster {
  private organization: string;
  private project: string;
  private token: string | undefined;
  private areaPath: string;
  private title: string;
  private customFieldName: string;
  private allowFieldCreation: boolean;
  private uploadAttachments: boolean;
  private attachmentsType: string[];
  private iterationPath: string;
  private assignedTo?: string;
  private severity: string;
  private bugCreationPolicy: BugCreationPolicy;
  private bugSignature: string;
  private reproSteps: string;
  private allowAreaPathCreation: boolean;

  constructor(
    organization: string,
    project: string,
    token: string | undefined,
    areaPath: string,
    title: string,
    customFieldName: string,
    allowFieldCreation: boolean,
    uploadAttachments: boolean,
    attachmentsType: string[],
    iterationPath: string,
    severity: string,
    bugCreationPolicy: BugCreationPolicy,
    bugSignature: string,
    reproSteps: string,
    allowAreaPathCreation: boolean,
    assignedTo?: string
  ) {
    this.organization = organization;
    this.project = project;
    this.token = token;
    this.areaPath = areaPath;
    this.title = title;
    this.customFieldName = customFieldName;
    this.allowFieldCreation = allowFieldCreation;
    this.uploadAttachments = uploadAttachments;
    this.attachmentsType = attachmentsType;
    this.iterationPath = iterationPath;
    this.assignedTo = assignedTo;
    this.severity = severity;
    this.bugCreationPolicy = bugCreationPolicy;
    this.bugSignature = crypto
      .createHash("md5")
      .update(bugSignature)
      .digest("hex");
    this.reproSteps = reproSteps;
    this.allowAreaPathCreation = allowAreaPathCreation;
  }

  async postBug(test: TestCase, result: TestResult) {
    const bugSignature = this.bugSignature;
    const title = this.title;
    console.log(`Creating bug for test: ${test.title}`);

    const reproSteps = this.reproSteps;

    if (this.allowAreaPathCreation) {
      await createAreaPathIfNotExists(
        this.organization,
        this.project,
        this.token,
        this.areaPath
      );
    }

    const resolvedIterationPath = await resolveIterationPath(
      this.organization,
      this.project,
      this.token,
      this.iterationPath
    );

    const fieldExists = await checkCustomFieldExists(
      this.organization,
      this.project,
      this.token,
      this.customFieldName
    );

    if (!fieldExists) {
      if (this.allowFieldCreation) {
        try {
          await createCustomField(
            this.organization,
            this.project,
            this.token,
            this.customFieldName
          );
        } catch (error) {
          console.error(
            `Failed to create custom field '${this.customFieldName}':`,
            error
          );
          return;
        }
      } else {
        console.error(
          `Custom field '${this.customFieldName}' does not exist. Enable 'allowFieldCreation' to create it.`
        );
        return;
      }
    }

    if (this.bugCreationPolicy !== "always") {
      const query = `
        SELECT [System.Id], [System.State]
        FROM WorkItems
        WHERE [System.TeamProject] = @project
        AND [System.WorkItemType] = 'Bug'
        AND [${this.customFieldName}] = '${bugSignature}'
      `;
      const existingBugs = await executeWiqlQuery(
        this.organization,
        this.project,
        this.token,
        query
      );

      if (this.bugCreationPolicy === "if-none" && existingBugs) {
        console.log("Bug already exists. Skipping creation.");
        return;
      }

      if (
        this.bugCreationPolicy === "if-none-open" &&
        existingBugs.some((bug: any) => bug.fields["System.State"] !== "Closed")
      ) {
        console.log("Open bug already exists. Skipping creation.");
        return;
      }
    }

    const payload = createBugPayload(
      title,
      this.areaPath,
      reproSteps,
      this.customFieldName,
      bugSignature,
      resolvedIterationPath,
      this.severity,
      this.assignedTo
    );

    const bugId = await createBug(
      this.organization,
      this.project,
      this.token,
      payload
    );

    if (this.uploadAttachments) {
      for (const attachment of result.attachments) {
        if (this.attachmentsType.includes(attachment.name)) {
          const attachmentUrl = await uploadAttachment(
            this.organization,
            this.project,
            this.token,
            attachment
          );
          await linkAttachmentToBug(
            this.organization,
            this.project,
            this.token,
            bugId,
            attachmentUrl,
            attachment.name
          );
        }
      }
    }
  }
}
