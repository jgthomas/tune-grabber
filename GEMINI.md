# GEMINI.md

This document provides a comprehensive overview of the `tune-grabber` project, its architecture, and development practices.

## Project Overview

`tune-grabber` is a lightweight web application that allows users to download audio from YouTube videos. It provides a simple UI to enter a YouTube URL and an API to process the download.

The application is built with Next.js (App Router) and uses `ytdlp-nodejs` to download and extract the audio. It can be configured to store the downloaded audio files in an AWS S3 bucket.

The project also includes a Terraform setup for deploying the application to AWS App Runner.

## Key Technologies

- **Framework:** Next.js
- **Language:** TypeScript
- **Downloader:** `ytdlp-nodejs`
- **Cloud:** AWS (S3, App Runner)
- **Infrastructure as Code:** Terraform
- **Containerization:** Docker

## Architecture

The application is divided into two main parts:

1.  **Frontend:** A Next.js application with a React-based UI. The frontend provides a form to submit YouTube URLs and displays the download link for the processed audio.
2.  **Backend:** A set of server-side components and API routes that handle the video downloading and audio extraction.

The backend can be configured to work in two modes:

- **Local Mode:** The audio files are stored in the `/tmp` directory of the server, and a local download link is provided.
- **S3 Mode:** The audio files are uploaded to an S3 bucket, and a pre-signed download link is provided.

## Building and Running

### Local Development

To run the application locally, you need to have Node.js and Yarn installed.

1.  **Install dependencies:**

    ```bash
    yarn install
    ```

2.  **Run the development server:**

    ```bash
    yarn dev
    ```

    The application will be available at `http://localhost:3000`.

### Docker

The application can also be run in a Docker container.

1.  **Build and start the container:**

    ```bash
    make up
    ```

2.  **Stop the container:**

    ```bash
    make down
    ```

### Testing

The project uses Jest for testing.

- **Run all tests:**

  ```bash
  yarn test
  ```

- **Run tests in watch mode:**

  ```bash
  yarn test:watch
  ```

- **Run tests with coverage:**

  ```bash
  yarn test:coverage
  ```

## Development Conventions

### Linting and Formatting

The project uses ESLint for linting and Prettier for code formatting.

- **Lint the code:**

  ```bash
  yarn lint
  ```

- **Fix linting errors:**

  ```bash
  yarn lint:fix
  ```

- **Format the code:**

  ```bash
  yarn format
  ```

### Type Checking

The project uses TypeScript for static type checking.

- **Check for type errors:**

  ```bash
  yarn type-check
  ```

### Git Hooks

The project should have git hooks set up to run linting, formatting, and tests before committing.

## Deployment

The application is deployed to AWS App Runner using a CI/CD pipeline powered by GitHub Actions. The workflow is defined in `.github/workflows/build-test-deploy.yml` and consists of three jobs:

1.  **`build-and-test`**: This job runs on every push and pull request. It performs the following steps:
    - Checks out the repository.
    - Sets up Node.js 24.
    - Installs dependencies using `yarn install`.
    - Runs quality checks: `yarn lint`, `yarn type-check`, `yarn test`, and `yarn build`.

2.  **`docker-build-and-push`**: This job runs after `build-and-test` succeeds and only on pushes to the `main` branch. It is responsible for:
    - Building a Docker image of the application.
    - Tagging the image with the Git SHA and `latest`.
    - Pushing the image to the Amazon ECR repository.

3.  **`deploy`**: This job runs after `docker-build-and-push` succeeds, also only on pushes to the `main` branch. It handles the infrastructure deployment using Terraform:
    - Configures AWS credentials.
    - Sets up Terraform.
    - Initializes Terraform with `terraform init`.
    - Creates a Terraform plan, passing the Docker image tag from the previous job as a variable.
    - Applies the Terraform plan automatically with `terraform apply -auto-approve tfplan`.

This automated workflow ensures that every push to the `main` branch that passes the quality checks is automatically built, pushed to ECR, and deployed to AWS App Runner.

### Manual Deployment

While the primary deployment method is through the CI/CD pipeline, manual deployment is still possible for development or debugging purposes. The `Makefile` and `bootstrap.sh` script provide the necessary commands for this. For more information, refer to the `Makefile` and the Terraform configuration in the `terraform` directory.

## Agent Workflows

### Git Flow

When performing git operations, adhere to the following branching strategy:

1.  **Branching:** Always branch off the `develop` branch to create feature or bugfix branches. **NEVER** branch off `main`.
2.  **Merging:** Only merge feature or bugfix branches back into the `develop` branch. **NEVER** merge directly into `main`.

### Pre-Completion Checks

Before marking a task as complete, always perform the following sequence:

1.  **Run Checks:** Execute `make check` to run linting, formatting, type checking, and tests.
2.  **Fix Issues:** If any errors occur, analyze the output and attempt to fix them autonomously.
3.  **Verify:** Only report the task as complete once `make check` passes successfully.
