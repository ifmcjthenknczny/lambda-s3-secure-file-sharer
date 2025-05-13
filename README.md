# Lambda S3 Secure File Sharer

> Want an easy way to share S3 files, but still control who gets in and for time longer than 12 hours?

A serverless application built with AWS Lambda, S3 and MongoDB to generate time-limited secret codes for accessing files stored in S3 via pre-signed URLs. The infrastructure is managed using AWS CDK, and CI/CD is implemented with GitHub Actions.

## Overview

This project provides a secure way to share files. It allows authorized users to generate unique "secret codes" which grant temporary access to specific files stored in an S3 bucket. When a user attempts to access a file using a Lambda URL with secret code in query params, the system validates the code, checks its expiry, and if valid, generates a short-lived pre-signed S3 URL, redirecting the user to the file. All access attempts and code generation events can be logged.

## Features

* **Secret Code Generation:** Creates unique, time-limited secret codes (UUIDs).
* **Disable Secret Codes:** Ability to manually disable certain codes by code or tag.
* **Secure Storage:** Stores secret codes and their metadata (associated filename, validity period) in MongoDB.
* **Pre-signed URL Access:** Provides access to S3 files via temporary, dynamically-generated secure pre-signed URLs.
* **Code Validation:** Validates secret codes for existence and expiry and use count.
* **Access Logging:** Logs attempts to use secret codes in MongoDB.
* **Serverless Architecture:** Utilizes AWS Lambda for compute, reducing operational overhead.
* **Public Access Point:** Exposes functionality via an AWS Lambda Function URL.
* **Infrastructure as Code (IaC):** AWS infrastructure is defined and managed using AWS CDK.
* **Environment Variable Management:** Securely handles configuration using `@t3-oss/env-core`.
* **CI/CD:** Automated build, test, and deployment pipelines using GitHub Actions.

## Technology Stack

* **Runtime:** Node.js (>=22)
* **Language:** TypeScript
* **AWS Services:**
    * AWS Lambda (Node.js 22.x runtime, ARM64 architecture)
    * Amazon S3 (for file storage)
    * AWS IAM (for permissions)
    * Amazon CloudWatch Logs (for Lambda logging)
* **Database:** MongoDB (accessed via Mongoose ORM)
* **Infrastructure as Code:** AWS Cloud Development Kit (CDK)
* **Key Libraries & Tools:**
    * `aws-sdk` (for S3 interactions)
    * `mongoose` (MongoDB ODM)
    * `dayjs` (date/time manipulation)
    * `zod` (schema declaration and validation)
    * `uuid` (for generating unique IDs)
    * `@t3-oss/env-core` (type-safe environment variables)
    * `dotenv` (loading environment variables from `.env` files)
    * `eslint`, `prettier` (linting and formatting)
    * `jest` (testing framework)
    * `yarn` (package manager)

## Prerequisites

Before you begin, ensure you have the following installed and configured:

* Node.js (version >=22.x, as specified in `package.json`)
* Yarn (version 1.22.19 or compatible)
* AWS CLI, configured with appropriate credentials and default region.
* AWS CDK (globally installed or via npx).
* Access to a MongoDB instance (local or cloud-hosted).
* Git.

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ifmcjthenknczny/lambda-s3-secure-file-sharer
    cd lambda-app
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in `lambda-app` directory by copying the example below. Fill in the values specific to your AWS account, S3 and MongoDB setup.

    ```env
    # .env
    AWS_ACCOUNT_ID=your_aws_account_id
    AWS_REGION=your_aws_region
    AWS_STACK_NAME=LambdaSecureFileSharerStack
    BUCKET_NAME=your_s3_bucket_name_for_files
    DATABASE_NAME=your_mongodb_database_name
    MONGO_URI=your_mongodb_connection_string
    ```

## Environment Variables

The application requires the following environment variables to be set (typically in a `.env` file for local development, and configured in the Lambda environment for deployment):

* `AWS_ACCOUNT_ID`: Your AWS Account ID.
* `AWS_REGION`: The AWS region where resources will be deployed (e.g., `us-east-1`).
* `AWS_STACK_NAME`: The name for the AWS CDK stack.
* `BUCKET_NAME`: The name of the S3 bucket where files are stored and will be accessed from.
* `DATABASE_NAME`: The name of the MongoDB database to use.
* `MONGO_URI`: The connection string for your MongoDB instance.

These are validated at runtime using `@t3-oss/env-core`.

## Actions

### Create Secret Codes

* **Trigger:** Invoke the Lambda function with the following `AppConfig` structure:
    ```json
    {
        "action": "CREATE_SECRET_CODES",
        "executionId": "some-unique-id",
        "rawEvent": {
            "daysValid": 7,
            "fileName": "path/to/your/file.pdf",
            "count": 10,
            "useLimit": 10,
            "tag": "secret-file"
        },
        "runningLocal": true
    }
    ```
* **Functionality (`src/actions/createSecretCodes.ts`):**
    * Parses the `rawEvent` using `createSecretCodesSchema`.
    * Generates the specified `count` of unique secret codes (UUIDs).
    * For each code, it stores an entry in the `SecretCodes` MongoDB collection, including the `_id` (the code itself), `fileName`, `useLimit` (optional), `createdAt`, and `expiresAt` (calculated using `daysValid`).
    * Codes are inserted into the database in chunks for efficiency.

### Disable Secret Codes

* **Trigger:** Invoke the Lambda function with the following `AppConfig` structure:
    ```json
    {
        "action": "DISABLE_SECRET_CODES",
        "executionId": "some-unique-id",
        "rawEvent": {
            "tags": ["secret-file", "a-bit-less-secret-file-but-still"],
            "codes": ["df83d390-bfc5-4a32-8322-7913927f0bf8", "36691982-fc9f-4d42-bb23-fddef15445f4"]
        },
        "runningLocal": true
    }
    ```
* **Functionality (`src/actions/disableSecretCodes.ts`):**
    * Parses the `rawEvent` using `disableSecretCodesSchema`.
    * Validates that at least one of the two properties (`codes` or `tags`) is provided.
    * Invokes `manuallyDisableSecretCodes`, which updates all matching documents in the `SecretCodes` MongoDB collection by setting `manuallyDisabled: true` for:
        - any document with `_id` in the `codes` array
        - or any document with `tag` in the `tags` array.
    * Logs a success message showing how many codes were successfully disabled.

### Create Signed URL (Access File)

* **Trigger:** This is the default action when the Lambda Function URL is accessed via a GET request.
* **URL Format:** `GET <LambdaFunctionUrl>?code=<YOUR_SECRET_CODE>`
    * Replace `<LambdaFunctionUrl>` with the actual URL output by the CDK deployment.
    * Replace `<YOUR_SECRET_CODE>` with a valid, unexpired secret code.
* **Functionality (`src/actions/createSignedUrl.ts`):**
    1.  Extracts the `code` from the `queryStringParameters`.
    2.  Logs the access attempt to the `UserLogs` collection in MongoDB.
    3.  Validates the code:
        * If no code is provided, returns a `403 Forbidden` error.
        * Searches for the code in the `SecretCodes` collection.
        * Checks if the code has expired.
        * Checks if use count of the code would be exceeded.
        * Checks if code is not manually disabled.
    4.  If the code is valid and not expired:
        * Generates a short-lived (60 seconds) pre-signed S3 URL for the `fileName` associated with the code.
        * Calls `useSecretCode` to mark the code as used (this function attempts to increment a `useCount` field in the database).
        * Returns an HTTP `302 Found` redirect response, with the `Location` header set to the pre-signed S3 URL.
    5.  If any error occurs during S3 interaction or other processing, returns a `400 Bad Request` or logs the error.

## Database Models (MongoDB)

### `SecretCodes`

Stores information about each generated secret code.

* `_id: string` (UUID): The secret code itself.
* `fileName: string`: The S3 object key (path to the file in the bucket along with its extension) this code grants access to.
* `createdAt: Date`: Timestamp of when the code was created.
* `expiresAt: Date`: Timestamp of when the code will expire.
* `useLimit: number`: Limit of uses of given secret code.
* `useCount: number`: If code is used, this field is incremented.
* `manuallyDisabled: boolean`: Information whether code has been manually disabled by user.

### `UserLogs`

Stores logs of attempts to use secret codes.

* The structure is a flexible `Record<string, any>`.
* Typically includes:
    * `code: string` (The secret code used, or undefined if not provided).
    * `data: object` (Other event details, excluding query string parameters).
    * `loggedAt: Date` (Timestamp of the log entry).

## License

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).

## Contact

For questions or feedback, please reach out via GitHub.
[ifmcjthenknczny](https://github.com/ifmcjthenknczny)