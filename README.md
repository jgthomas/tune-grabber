## tune-grabber — lightweight YouTube audio downloader

- Purpose: provide a small web UI and API to download YouTube audio and return an MP3 file.
- Tech: Next.js (App Router), server-side downloaders using a `ytdlp` wrapper, S3 upload helpers, and URL validation.

### Quick overview

- `src/app/api/download/route.ts` — streaming download API that serves files from `/tmp`.
- `src/lib/downloaders/youtube/*` — wrappers around `ytdlp-nodejs`
- `src/lib/aws/s3-service.ts` — helpers for uploading downloaded assets to S3.

###Developer commands

```bash
# Install
yarn install

# Run tests
yarn test

# Run dev server
yarn dev
```

### Running with Docker

You can run the app locally in a container:

```bash
# Start-up
make up

# Teardown
make down
```

### Deployment: AWS App Runner & Terraform

This project includes Terraform scripts (see `terraform/`) to deploy the app to AWS App Runner. The infrastructure includes:

- Containerized app build and deploy
- S3 bucket for storing downloaded audio
- Usage and cost monitoring

#### To deploy

1. Configure your AWS credentials
2. Run the `bootstrap.sh` script
3. Run the deploy pipeline on `main` branch
4. App Runner will launch the service

---
