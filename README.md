# GitHub Action - Replace placeholders

This GitHub Action helps to replace all placeholders like ${{name_1}} in file


## Usage

Add this step in your workflow file
```yaml
-   name: Run Replace Placeholders Action
    uses: A-A-S-DevLab/actions-replace-placeholders@v1.0.0
    with:
        configs_path: 'templates/files'  # Directory with files (or specify a single file path)
        configs_mask: '*.txt'  # Mask to filter files (e.g., '*.txt', '*.json')
        json_data: ${{ steps.service_secrets.outputs.credentials }}  # JSON object with replacement values
        is_allow_unresolved: false  # Fail on placeholders without a value
        output_path: 'dist/files-output'  # Directory to save modified files
```

## Input Variables

- `configs_path`: The path to the config file or directory.
- `configs_mask`: File name mask: `*` matches any characters, `?` one character, case-insensitive (e.g., `*.txt`, `*.json`, `*.*`, `*`). Default `*.json`. In directory mode subdirectories are processed too, and their structure is kept in `output_path`.
- `json_data`: JSON object `{"key": "value"}` with the replacement data. Values must be strings, numbers, booleans or `null`. Keys are case-insensitive: `${{ DB_PASSWORD }}` and `${{ db_password }}` get the value of `db_password`; keys that differ only in case fail the step.
- `is_allow_unresolved`: Allow placeholders without a value in `json_data`: `true` — they stay in the file as is, `false` — the step fails and lists the keys and files, without values. Default to true.
- `output_path`: Directory where modified files will be saved.

In `*.json` files a value is escaped as the content of a JSON string (`"`, `\`, line breaks), so a placeholder must be inside quotes: `"Password": "${{ db_password }}"`. In other files values are inserted as is.
