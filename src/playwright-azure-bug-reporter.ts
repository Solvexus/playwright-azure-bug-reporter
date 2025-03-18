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
  }

  onBegin(config: FullConfig, suite: Suite) {}

  onTestBegin(test: TestCase, result: TestResult) {}

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status !== "passed") {
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
        resolveValue(this.assignedTo, test, result)
      );

      const promise = bugPoster
        .postBug(test, result)
        .catch((e) => console.error("Bug posting failed:", e));
      this.pendingPromises.push(promise);
    }
  }

  async onEnd() {
    await Promise.all(this.pendingPromises);
  }
}
export default PlaywrightAzureBugReporter;
