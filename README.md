# GitHub Action - Replace placeholders

Replaces `${{ key }}` placeholders in config files with values from a JSON object.

## Usage

```yaml
-   name: Replace placeholders
    uses: A-A-S-DevLab/actions-replace-placeholders@v1.0.0
    with:
        configs_path: './config'
        configs_mask: '*.*'
        json_data: ${{ steps.service_secrets.outputs.credentials }}
        is_allow_unresolved: false
        output_path: './copy-to-host/config'
```

## Inputs

- `configs_path` — required. Path to a config file or directory, relative to the workspace.
- `configs_mask` — optional, default `*.json`. File name mask: `*` — any characters, `?` — one character, case-insensitive (`*.json`, `*.*`, `*`).
- `json_data` — required. JSON object `{"key": "value"}` with the replacement data.
- `is_allow_unresolved` — optional, default `true`. Allow placeholders without a value in `json_data`: `true` — they stay in the file as is, `false` — the step fails and no file is written.
- `output_path` — required. Directory for the processed files, relative to the workspace.

## Rules

- A directory is processed with subdirectories, their structure is kept in `output_path`; a single file is skipped if it does not match `configs_mask`.
- Keys are case-insensitive: `${{ DB_PASSWORD }}` and `${{ db_password }}` get the value of `db_password`. Keys that differ only in case fail the step.
- Values in `json_data` must be strings, numbers, booleans or `null`; `null` is an empty string.
- In `*.json` files a value is escaped as the content of a JSON string (`"`, `\`, line breaks), so a placeholder must be inside quotes: `"Password": "${{ db_password }}"`. In other files values are inserted as is.
- All files are checked before any is written.
- `configs_path` and `output_path` must be relative; a missing directory is created.

## Logs

Key and file names only, values are never logged:

```
🟡 Unresolved placeholders: smtp_host in appsettings.json
📁 Created directory: copy-to-host/config
✅ Updated: copy-to-host/config/appsettings.json
```

A single file that does not match the mask: `🟡 Skipped file: config/readme.txt (does not match mask: *.json)`.

An error fails the step: `❌ Error: Unresolved placeholders: smtp_host in appsettings.json`.
