# Playwright Azure Bug Reporter

A custom reporter for Playwright that automatically creates bugs in Azure DevOps when tests fail.

[![npm version](https://badge.fury.io/js/@solvexus%2Fplaywright-azure-bug-reporter.svg)](https://www.npmjs.com/package/@solvexus/playwright-azure-bug-reporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Automatically creates bugs in Azure DevOps when Playwright tests fail
- Configurable bug creation policies to prevent duplicate bugs
- Support for custom fields and area paths
- Automatic attachment upload (screenshots, videos, logs)
- Flexible iteration path handling (current, next, backlog)
- Customizable bug properties (severity, assigned to, etc.)

## Installation

```bash
npm install @solvexus/playwright-azure-bug-reporter --save-dev
```

## Project Structure

- `src/` - Source code files
- `dist/` - Compiled JavaScript files and type definitions
- `playwright-azure-bug-reporter.js` - Main entry point
- `playwright-azure-reporter.d.ts` - TypeScript type definitions

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

| Option                     | Type                 | Required | Default                             | Description                                              |
| -------------------------- | -------------------- | -------- | ----------------------------------- | -------------------------------------------------------- |
| `organization`             | `string`             | Yes      | -                                   | Azure DevOps organization name                           |
| `project`                  | `string`             | Yes      | -                                   | Azure DevOps project name                                |
| `token`                    | `string`             | Yes      | -                                   | Azure DevOps Personal Access Token                       |
| `areaPath`                 | `string`             | Yes      | -                                   | Area path for bug creation                               |
| `title`                    | `string \| Function` | No       | `Automated Bug Report: {testTitle}` | Bug title                                                |
| `uniqueSignatureFieldName` | `string`             | No       | `Custom.BugSignature`               | Custom field name for bug signature                      |
| `allowFieldCreation`       | `boolean`            | No       | `true`                              | Allow creation of custom fields                          |
| `uploadAttachments`        | `boolean`            | No       | `false`                             | Enable attachment uploads                                |
| `attachmentsType`          | `string[]`           | No       | `['screenshot', 'video', 'log']`    | Types of attachments to upload                           |
| `iterationPath`            | `string`             | No       | `backlog`                           | Iteration path (`current`, `next`, `backlog`, or custom) |
| `assignedTo`               | `string`             | No       | -                                   | User to assign bugs to                                   |
| `severity`                 | `string`             | No       | `3 - Medium`                        | Bug severity level                                       |
| `bugCreationPolicy`        | `string`             | No       | `if-none-open`                      | Bug creation policy                                      |

## Bug Creation Policies

- `always`: Creates a new bug for every test failure
- `if-none`: Creates a bug only if no matching bug exists
- `if-none-open`: Creates a bug only if no matching open bug exists

## Required Azure DevOps Permissions

The Personal Access Token (PAT) must have the following permissions:

- Work Items (Read & Write)
- Analytics (Read)

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
