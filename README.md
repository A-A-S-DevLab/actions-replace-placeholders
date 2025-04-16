# GitHub Action - Replace placeholders

This GitHub Action helps to replace all placeholders in file


## Usage

Add this step in your workflow file
```yaml
-   name: Run Replace Placeholders Action
    uses: A-A-S-DevLab/actions-replace-placeholders@v1.0.0
    with:
        template_path: 'templates/files'  # Directory with files (or specify a single file path)
        data_path: 'data/values.json'  # JSON file with replacement values
        output_dir: 'dist/files-output'  # Directory to save modified files
        mask: '**/*.txt'  # Mask to filter files (e.g., '*.txt', '**/*.json')
```

## Input Variables

- `template_path`: The path to the template file or directory.
- `data_path`: Path to the JSON file containing the replacement data.
- `output_dir`: Directory where modified files will be saved.
- `mask`: 'Glob pattern to filter files in the directory (default is `**/*.json`).'

