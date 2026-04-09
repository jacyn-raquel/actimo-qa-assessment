# Actimo QA Assessment

## Setup

1. Install dependencies:

```powershell
npm.cmd install
```

2. Set environment variables in your shell or copy values from `.env.example`:

```powershell
$env:ACTIMO_BASE_URL='https://app.actimo.com/admin'
$env:ACTIMO_EMAIL='your-email@example.com'
$env:ACTIMO_PASSWORD='your-password'
$env:ACTIMO_MESSAGE_PREFIX='QA Assessment'
```

## Run

```powershell
npm.cmd test
```

To watch the browser:

```powershell
npm.cmd run test:headed
```

## Included tests

- `message-text-persistence.spec.ts`
- `message-grid-validation.spec.ts`
- `message-publish-settings.spec.ts`

The suite covers core authoring, validation, and publish configuration flows for the Messages feature.
