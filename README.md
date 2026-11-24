# GitHub Action - Replace placeholders

This GitHub Action helps to replace all placeholders like ${{name_1}} in file


## Usage

Add this step in your workflow file
```yaml
-   name: Run Replace Placeholders Action
    uses: A-A-S-DevLab/actions-replace-placeholders@v1.0.0
    with:
        template_path: 'templates/files'  # Directory with files (or specify a single file path)
        json: ${{ steps.service_secrets.outputs.credentials }}  # JSON object with replacement values
        output_dir: 'dist/files-output'  # Directory to save modified files
        mask: '*.txt'  # Mask to filter files (e.g., '*.txt', '*.json')
```

## Input Variables

- `template_path`: The path to the template file or directory.
- `json`: JSON object `{"key": "value"}` with the replacement data. Values must be strings, numbers, booleans or `null`. Keys are case-insensitive: `${{ DB_PASSWORD }}` and `${{ db_password }}` get the value of `db_password`; keys that differ only in case fail the step.
- `output_dir`: Directory where modified files will be saved.
- `is_allow_unresolved`: Allow placeholders without a value in `json`: `true` — they stay in the file as is, `false` — the step fails and lists the keys and files, without values. Default to true.
- `mask`: File name mask: `*` matches any characters, `?` one character, case-insensitive (e.g., `*.txt`, `*.json`, `*.*`, `*`). Default `*.json`. In directory mode subdirectories are processed too, and their structure is kept in `output_dir`.

In `*.json` files a value is escaped as the content of a JSON string (`"`, `\`, line breaks), so a placeholder must be inside quotes: `"Password": "${{ db_password }}"`. In other files values are inserted as is.
