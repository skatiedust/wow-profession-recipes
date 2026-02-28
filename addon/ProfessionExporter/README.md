# Profession Exporter

A WoW addon for TBC Anniversary that exports your known profession recipes to JSON for use with the [Guild Recipes](https://github.com/your-org/wow-professions) web app.

## Installation

1. Download the latest addon zip from your public artifacts URL:
   - `https://storage.googleapis.com/<your-addon-bucket>/latest/ProfessionExporter.zip`
   - You can get `<your-addon-bucket>` from Terraform output:
     - `cd terraform && terraform output -raw addon_artifacts_bucket_name`
2. Copy the `ProfessionExporter` folder into your WoW addons directory:
   - **Windows:** `World of Warcraft\_classic_\Interface\AddOns\ProfessionExporter\`
   - **Mac:** `World of Warcraft/_classic_/Interface/AddOns/ProfessionExporter/`
3. Ensure the folder contains `ProfessionExporter.toc` and `ProfessionExporter.lua`.
4. Restart WoW or run `/reload`.

To update, download the latest zip again and replace the existing `ProfessionExporter` folder.

## Usage

1. Open your profession window (press **P**, then click a profession such as Alchemy or Engineering).
2. Type `/exportrecipes` in the chat box.
3. A window appears with the exported JSON. Select all (Ctrl+A) and copy (Ctrl+C).
4. Paste the JSON into the Guild Recipes web app's Import from Addon modal.

## JSON Output Format

The addon exports a JSON object with the following fields:

```json
{
  "character": "YourCharacterName",
  "realm": "YourRealm",
  "profession": "Alchemy",
  "recipes": ["Recipe Name 1", "Recipe Name 2", "Recipe Name 3"]
}
```

| Field       | Description                                      |
| ----------- | ------------------------------------------------ |
| `character` | Your character's name                            |
| `realm`     | Your realm name                                  |
| `profession` | The profession (e.g. Alchemy, Engineering)     |
| `recipes`   | Array of recipe names you know for that profession |

This format is consumed by the Guild Recipes web app to sync your known recipes with the guild database.
