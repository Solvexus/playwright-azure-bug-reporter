import type { FullConfig } from "@playwright/test";
import type {
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import {
  AzureBugReporterConfig,
  BugCreationPolicy,
  ValueOrFunction,
} from "./reporter-config";
import { BugPoster } from "./bug-poster";

const resolveValue = <T>(
  value: T | ((test: TestCase, result: TestResult) => T),
  test: TestCase,
  result: TestResult
): T =>
  typeof value === "function"
    ? (value as (test: TestCase, result: TestResult) => T)(test, result)
    : value;

class PlaywrightAzureBugReporter implements Reporter {
  private pendingPromises: Promise<void>[] = [];
  private organization: ValueOrFunction<string>;
  private project: ValueOrFunction<string>;
  private token: ValueOrFunction<string>;
  private areaPath: ValueOrFunction<string>;
  private title: ValueOrFunction<string>;
  private uniqueSignatureFieldName: ValueOrFunction<string>;
  private allowFieldCreation: ValueOrFunction<boolean>;
  private uploadAttachments: ValueOrFunction<boolean>;
  private attachmentsType: ValueOrFunction<string[]>;
  private iterationPath: ValueOrFunction<string>;
  private assignedTo?: ValueOrFunction<string>;
  private severity: ValueOrFunction<string>;
  private bugCreationPolicy: ValueOrFunction<BugCreationPolicy>;
  private bugSignature: ValueOrFunction<string>;
  private reproSteps: ValueOrFunction<string>;
  private allowAreaPathCreation: ValueOrFunction<boolean>;
  private maximumNumberOfBugs: ValueOrFunction<number>;
  private bugsCreated: number = 0;

  constructor(config: AzureBugReporterConfig) {
    const { organization, project, token, areaPath } = config;

    if (!organization || !project || !token || !areaPath) {
      throw new Error(
        "AzureBugReporter configuration is invalid. 'organization', 'project', 'token', and 'areaPath' are required fields."
      );
    }

    this.organization = organization;
    this.project = project;
    this.token = token;
    this.areaPath = areaPath;
    this.title =
      config.title || ((test, result) => `Automated Bug Report: ${test.title}`);
    this.uniqueSignatureFieldName =
      config.uniqueSignatureFieldName || "Custom.BugSignature";
    this.allowFieldCreation = config.allowFieldCreation ?? true;
    this.uploadAttachments = config.uploadAttachments ?? false;
    this.attachmentsType = config.attachmentsType || [
      "screenshot",
      "video",
      "log",
    ];
    this.iterationPath = config.iterationPath || "backlog";
    this.assignedTo = config.assignedTo || undefined;
    this.severity = config.severity || "3 - Medium";
    this.bugCreationPolicy = config.bugCreationPolicy || "if-none-open";
    this.bugSignature = config.bugSignature || ((test) => test.title);
    this.reproSteps =
      config.reproSteps ||
      ((test, result) =>
        `
        <div>
          <b>Test File:</b> ${test.location?.file}<br>
          <b>Line:</b> ${test.location?.line}<br>
          <b>Status:</b> ${result.status}<br>
          <b>Error:</b> ${result.error?.message || "N/A"}<br>
          <b>Stack:</b><br><pre>${result.error?.stack || "N/A"}</pre>
        </div>
      `.trim());
    this.allowAreaPathCreation = config.allowAreaPathCreation ?? true;
    this.maximumNumberOfBugs = config.maximumNumberOfBugs ?? 5;
  }

  onBegin(config: FullConfig, suite: Suite) {}

  onTestBegin(test: TestCase, result: TestResult) {}

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== "passed") {
      const maxBugs = resolveValue(this.maximumNumberOfBugs, test, result);
      
      if (this.bugsCreated >= maxBugs) {
        console.log(`Maximum number of bugs (${maxBugs}) reached. Skipping bug creation for test: ${test.title}`);
        return;
      }
      
      const bugPoster = new BugPoster(
        resolveValue(this.organization, test, result),
        resolveValue(this.project, test, result),
        resolveValue(this.token, test, result),
        resolveValue(this.areaPath, test, result),
        resolveValue(this.title, test, result),
        resolveValue(this.uniqueSignatureFieldName, test, result),
        resolveValue(this.allowFieldCreation, test, result),
        resolveValue(this.uploadAttachments, test, result),
        resolveValue(this.attachmentsType, test, result),
        resolveValue(this.iterationPath, test, result),
        resolveValue(this.severity, test, result),
        resolveValue(this.bugCreationPolicy, test, result),
        resolveValue(this.bugSignature, test, result),
        resolveValue(this.reproSteps, test, result),
        resolveValue(this.allowAreaPathCreation, test, result),
        resolveValue(this.assignedTo, test, result)
      );

      const promise = bugPoster
        .postBug(test, result)
        .then(() => {
          this.bugsCreated++;
        })
        .catch((e) => console.error("Bug posting failed:", e));
      this.pendingPromises.push(promise);
    }
  }

  async onEnd() {
    await Promise.all(this.pendingPromises);
  }
}
export default PlaywrightAzureBugReporter;
