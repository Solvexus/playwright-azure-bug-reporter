# Playwright Azure Bug Reporter

A custom reporter for Playwright that automatically creates bugs in Azure DevOps when tests fail.

[![npm version](https://img.shields.io/npm/v/@solvexus/playwright-azure-bug-reporter.svg)](https://www.npmjs.com/package/@solvexus/playwright-azure-bug-reporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.51-green.svg)](https://playwright.dev)

[Installation](#installation) | [Usage](#usage) | [Configuration](#configuration-options) | [Authentication](#azure-devops-authentication) | [Pipeline](#azure-pipeline-integration) | [Advanced](#advanced-configuration)

## Features

- Automatically creates bugs in Azure DevOps when Playwright tests fail
- Configurable bug creation policies to prevent duplicate bugs
- Support for custom fields and area paths
- Automatic attachment upload (screenshots, videos, logs)
- Flexible iteration path handling (current, next, backlog)
- Customizable bug properties (severity, assigned to, etc.)

## Installation

```bash
npm install @solvexus/playwright-azure-bug-reporter
```

## Usage

Add the reporter to your Playwright configuration file (`playwright.config.ts`):

```typescript
import { AzureBugReporterConfig } from "@solvexus/playwright-azure-bug-reporter/dist/reporter-config";

const config: PlaywrightTestConfig = {
  reporter: [
    ["list"],
    [
      "@solvexus/playwright-azure-bug-reporter",
      {
        organization: "your-org",
        project: "your-project",
        token: process.env.AZURE_PAT,
        areaPath: "Your-Project\\Area\\Path",
        // Optional configurations
        title: (test) => `Failed Test: ${test.title}`,
        severity: "2 - High",
        bugCreationPolicy: "if-none-open",
        uploadAttachments: true,
      } as AzureBugReporterConfig,
    ],
  ],
  // ... rest of your config
};
```

For more information about configuring reporters in Playwright, see the [Playwright Reporters documentation](https://playwright.dev/docs/test-reporters).

## Configuration Options

| Option                     | Type                              | Required | Default                                               | Description                                                      |
| -------------------------- | --------------------------------- | -------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| `organization`             | `string \| Function`              | Yes      | -                                                     | Azure DevOps organization name                                   |
| `project`                  | `string \| Function`              | Yes      | -                                                     | Azure DevOps project name                                        |
| `token`                    | `string \| Function`              | Yes      | -                                                     | Azure DevOps Personal Access Token                               |
| `areaPath`                 | `string \| Function`              | Yes      | -                                                     | Area path for bug creation (e.g., "Project\\Area\\Path")         |
| `title`                    | `string \| Function`              |          | `` (test) => `Automated Bug Report: {test.title}`  `` | Bug title template or function                                   |
| `reproSteps`               | `string \| Function`              |          | Custom HTML template\*                                | HTML content for reproduction steps                              |
| `assignedTo`               | `string \| Function`              |          | -                                                     | User to assign bugs to (email or display name)                   |
| `severity`                 | `AzureDevOpsSeverity \| Function` |          | `3 - Medium`                                          | Bug severity (1-Critical through 4-Low)                          |
| `iterationPath`            | `string \| Function`              |          | `backlog`                                             | Target iteration (`current`, `next`, `backlog`, or custom path)  |
| `bugCreationPolicy`        | `BugCreationPolicy \| Function`   |          | `if-none-open`                                        | When to create new bugs (`always`,`if-none`,`if-none-open`)      |
| `bugSignature`             | `string \| Function`              |          | `(test) => test.title`                                | Value of the unique bug signature to check if bug already exists |
| `uniqueSignatureFieldName` | `string \| Function`              |          | `Custom.BugSignature`                                 | Custom field name for storing bug signatures                     |
| `allowFieldCreation`       | `boolean \| Function`             |          | `true`                                                | Whether to create custom fields if they don't exist              |
| `allowAreaPathCreation`    | `boolean \| Function`             |          | `true`                                                | Whether to create area paths if they don't exist                 |
| `uploadAttachments`        | `boolean \| Function`             |          | `false`                                               | Whether to upload test attachments to bugs                       |
| `attachmentsType`          | `string[] \| Function`            |          | `['screenshot','video','log']`                        | Types of attachments to include                                  |
| `maximumNumberOfBugs`      | `number \| Function`              |          | `5`                                                   | Maximum number of bugs that can be created in one test run       |

\* Example of custom HTML repro steps:

```typescript
(test, result) =>
  `<div>
    <b>Test File:</b> ${test.location?.file}<br>
    <b>Line:</b> ${test.location?.line}<br>
    <b>Status:</b> ${result.status}<br>
    <b>Error:</b> ${result.error?.message || "N/A"}<br>
    <b>Stack:</b><br><pre>${result.error?.stack || "N/A"}</pre>
  </div>`;
```

All configuration options can be provided as static values, example:

```typescript
severity: "2 - High";
```

or functions of the test case and result, example:

```typescript
severity: (test, result) =>
  result.error?.message?.includes("critical") ? "1 - Critical" : "2 - High";
```

## Azure DevOps Authentication

This reporter uses a Personal Access Token (PAT) to create bugs in Azure DevOps. Your PAT must have the following permissions:

- Work Items (Read & Write)
- Analytics (Read)

You can find instructions how to generate a PAT in the [Microsoft Documentation](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops&tabs=Windows).

During local development, you can store your PAT in a `.env` file. Be sure to add `.env` to your `.gitignore` to avoid leaking it. Then you can use it in `playwright.config.ts` (see [configuration](#configuration-options)):

```typescript
      {
        token: process.env.AZURE_PAT,
      }
```

If you are running your Playwright script in an Azure Pipeline (see [below](#azure-pipeline-integration)), then you can add the token as a pipeline variable:

- Go to your pipeline settings
- Click "Variables", "New variable"
- Name: `AZURE_PAT`
- Value: Paste your PAT
- Check "Keep this value secret"
- Click "OK"

## Azure Pipeline Integration

To run your Playwright tests in Azure Pipelines and automatically create bugs for failed tests, create a `azure-pipelines.yml` file in your repository:

```yaml
trigger: none # Disables triggers on branch pushes

schedules:
  - cron: "0 0 * * *" # Runs at midnight every day (UTC)
    displayName: "Daily Midnight Schedule"
    branches:
      include:
        - main # Only triggers on the 'main' branch
    always: true # Ensures the pipeline runs even if there are no changes

pool:
  name: Self-hosted # Put your pool argument here, where you want to run this pipeline

steps:
  - task: UseNode@1
    inputs:
      version: "20.x" # Use your version of Node here
  - script: npm install
    displayName: "npm install"
  - script: npx playwright install --with-deps
    displayName: "Install Playwright browsers"
  - script: npx playwright test
    displayName: "Run Playwright tests"
    env:
      CI: "true"
      AZURE_PAT: "$(AZURE_PAT)" # Used by playwright-azure-bug-reporter
    continueOnError: true
```

The pipeline will:

1. Install Node.js and project dependencies
2. Install Playwright browsers
3. Run tests
4. Create bugs in Azure DevOps for failed tests

## Advanced Configuration

### Bug Creation Policies

The `bugCreationPolicy` option controls when a new bug should be created in Azure DevOps to help you avoid duplicate reports.

- **`if-none-open`** (default): A new bug is created **only if there are no matching _open_ bugs**. This is the most common use case.
- **`if-none`**: A new bug is created **only if no matching bug exists at all**, regardless of its status (open or closed).
- **`always`**: A new bug is created **for every test failure**, even if a matching bug already exists.

Matching is determined using the `bugSignature` field, which uniquely identifies each bug. By default, this is set to `test.title` and is stored in a custom field called `Custom.BugSignature`.

> **Tip:** You can customize the signature logic by providing your own function for `bugSignature`.

If the `Custom.BugSignature` field does not exist in your Azure DevOps project, the reporter will automatically create it (unless you disable this with `allowFieldCreation: false`).

> **Note:** The automatically created field is hidden by default. To make it visible in your bug layout, follow [Microsoft's instructions to show custom fields](https://learn.microsoft.com/en-us/azure/devops/organizations/settings/work/add-custom-field?view=azure-devops#add-a-field).

### Area Paths

Area paths help organize work items in Azure DevOps. The reporter can automatically create paths:

```typescript
{
  // Area path format: Project\Area\Subarea
  areaPath: "MyProject\\QA\\Automated",

  // Control area path creation
  allowAreaPathCreation: true
}
```

### Iteration Paths

Iteration paths define sprints/milestones. Supported formats:

- `"current"`: Current sprint
- `"next"`: Next sprint
- `"backlog"`: Project backlog
- Custom path: `"MyProject\\Release 1\\Sprint 2"`

```typescript
{
  iterationPath: "current", // Use current sprint
  // or
  iterationPath: "MyProject\\Release 1\\Sprint 2" // Custom path
}
```

### Maximum Number of Bugs

You can limit the number of bugs created in a single test run using the `maximumNumberOfBugs` option:

```typescript
{
  // Limit to 10 bugs per test run
  maximumNumberOfBugs: 10,
  
  // Or use a function to determine the limit dynamically
  maximumNumberOfBugs: (test, result) => 
    process.env.NODE_ENV === 'production' ? 5 : 20
}
```

When the limit is reached, the reporter will log a message indicating that the maximum number of bugs has been reached and skip creating bugs for any subsequent test failures.

## Project Structure

- `src/` - Source code files
- `dist/` - Compiled JavaScript files and type definitions
- `playwright-azure-bug-reporter.js` - Main entry point
- `playwright-azure-reporter.d.ts` - TypeScript type definitions

## Development

To build the project:

```bash
npm install
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Mounir Bendouch** - [Solvexus](https://github.com/Solvexus/)

## Support

For support, issues, or feature requests, please [file an issue](https://github.com/Solvexus/playwright-azure-bug-reporter/issues).
