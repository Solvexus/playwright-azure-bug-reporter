import type { TestCase, TestResult } from "@playwright/test/reporter";

/**
 * Represents a value that can either be a static value or a function
 * that resolves the value dynamically based on the test case and result.
 */
export type ValueOrFunction<T> =
  | T
  | ((test: TestCase, result: TestResult) => T);

/**
 * Represents the severity levels for Azure DevOps bugs.
 */
export type AzureDevOpsSeverity =
  | "1 - Critical"
  | "2 - High"
  | "3 - Medium"
  | "4 - Low";

/**
 * Represents the types of files that Playwright generates after a failed test.
 */
export type AttachmentType = "screenshot" | "video" | "log";

/**
 * Represents the policy for bug creation.
 * - "always": Always create a new bug.
 * - "if-none": Create a bug only if no matching bug exists.
 * - "if-none-open": Create a bug only if no matching open bug exists.
 */
export type BugCreationPolicy = "always" | "if-none" | "if-none-open";

/**
 * Configuration options for the Azure Bug Reporter.
 */
export interface AzureBugReporterConfig {
  /**
   * The Azure DevOps organization name.
   * Can be a static string or a function that resolves dynamically.
   */
  organization: ValueOrFunction<string>;

  /**
   * The Azure DevOps project name.
   * Can be a static string or a function that resolves dynamically.
   */
  project: ValueOrFunction<string>;

  /**
   * The Personal Access Token (PAT) for authenticating with Azure DevOps.
   * The PAT must have the following permissions:
   * - Work Items (Read & Write)
   * - Analytics (Read)
   *
   * For more information on creating a PAT, see:
   * https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate
   */
  token: ValueOrFunction<string>;

  /**
   * The area path in Azure DevOps where the bug will be created.
   * Can be a static string or a function that resolves dynamically.
   */
  areaPath: ValueOrFunction<string>;

  /**
   * The title of the bug to be created.
   * Can be a static string or a function that resolves dynamically.
   * Defaults to "Automated Bug Report: <test title>" if not provided.
   */
  title?: ValueOrFunction<string>;

  /**
   * The name of the custom field used to store a unique bug signature.
   * Can be a static string or a function that resolves dynamically.
   * Defaults to "Custom.BugSignature" if not provided.
   */
  uniqueSignatureFieldName?: ValueOrFunction<string>;

  /**
   * Whether to allow the creation of the custom field if it does not exist.
   * Can be a static boolean or a function that resolves dynamically.
   * Defaults to `true`.
   */
  allowFieldCreation?: ValueOrFunction<boolean>;

  /**
   * Whether to upload attachments (e.g., screenshots, logs) to the bug.
   * Can be a static boolean or a function that resolves dynamically.
   * Defaults to `false`.
   */
  uploadAttachments?: ValueOrFunction<boolean>;

  /**
   * The types of attachments to upload (e.g., "screenshot", "log").
   * Can be a static array of strings or a function that resolves dynamically.
   * Defaults to `["screenshot", "video", "log"]`.
   */
  attachmentsType?: ValueOrFunction<AttachmentType[]>;

  /**
   * The iteration path in Azure DevOps where the bug will be created.
   * Can be a static string or a function that resolves dynamically.
   * Defaults to "backlog" if not provided.
   */
  iterationPath?: ValueOrFunction<string>;

  /**
   * The user to whom the bug will be assigned.
   * Can be a static string or a function that resolves dynamically.
   * Defaults to `undefined` (unassigned).
   */
  assignedTo?: ValueOrFunction<string>;

  /**
   * The severity level of the bug.
   * Can be a static string or a function that resolves dynamically.
   * Defaults to "3 - Medium".
   */
  severity?: ValueOrFunction<AzureDevOpsSeverity>;

  /**
   * The policy for bug creation.
   * Can be a static string or a function that resolves dynamically.
   * Defaults to "if-none-open".
   */
  bugCreationPolicy?: ValueOrFunction<BugCreationPolicy>;

  /**
   * Custom function to generate a unique bug signature.
   * This signature is used to detect duplicate bugs.
   * Can be a static string or a function that resolves dynamically.
   * Default: Uses test title as signature
   */
  bugSignature?: ValueOrFunction<string>;

  /**
   * Custom function to generate reproduction steps.
   * Can be a static string or a function that resolves dynamically.
   * Default: Uses test location, status and error details
   */
  reproSteps?: ValueOrFunction<string>;

  /**
   * Whether to allow creation of area paths if they don't exist.
   * Can be a static boolean or a function that resolves dynamically.
   * Default: true
   */
  allowAreaPathCreation?: ValueOrFunction<boolean>;
}
