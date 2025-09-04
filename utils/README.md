# Family Tree Data Utilities

This directory contains utility scripts for working with the family tree data stored in MongoDB.

## Available Scripts

### 1. Excel Data Extractor (`extractor.py`)

This Python script extracts family data from the Excel file (`sample_data.xlsx`) and imports it into the MongoDB collection specified in the `.env` file.

**Usage:**
```bash
python extractor.py
```

**Features:**
- Reads family member data from Excel spreadsheet
- Cleans and validates data fields
- Establishes family relationships (spouse, children)
- Inserts data into MongoDB collection

### 2. Family Hierarchy Display (`display_hierarchy.js`)

This Node.js script connects to MongoDB and displays the family hierarchy in the console, showing the relationships between family members.

**Usage:**
```bash
node display_hierarchy.js
```

**Features:**
- Displays family hierarchy in a tree structure
- Shows detailed information about each family member
- Generates a JSON file (`family_data_output.json`) with structured data

### 3. HTML Report Generator (`generate_html_report.js`)

This script generates a visually appealing HTML report of the family tree data from MongoDB.

**Usage:**
```bash
node generate_html_report.js
```

**Features:**
- Creates an HTML file with a styled family tree visualization
- Includes detailed information cards for each family member
- Shows family relationships in a hierarchical structure

### 4. Budimbe Data Extractor (`extract_budimbe_data.js`)

This script extracts raw data specifically from the basajja.budimbe collection and saves it to a JSON file.

**Usage:**
```bash
node extract_budimbe_data.js
```

**Features:**
- Connects directly to the basajja.budimbe collection
- Extracts all raw data from the collection
- Provides a structured view of the data
- Saves the complete data to `budimbe_data.json`

### 5. Budimbe Report Generator (`generate_budimbe_report.js`)

This script generates a focused HTML report specifically for the basajja.budimbe collection data.

**Usage:**
```bash
node generate_budimbe_report.js
```

**Features:**
- Creates a visually appealing HTML report focused on budimbe data
- Displays family member details including images if available
- Shows family relationships in a hierarchical structure
- Saves the report to `budimbe_report.html`

## Configuration

All scripts use the MongoDB connection details and collection name from the `.env` file in the project root:

```
DB_NAME=basajja
COLLECTION_NAME=basajja.budimbe
MONGODB_URI=mongodb+srv://...
```

## Data Flow

1. Excel data (`sample_data.xlsx`) → MongoDB via `extractor.py`
2. MongoDB data → Console output and JSON via `display_hierarchy.js`
3. MongoDB data → HTML report via `generate_html_report.js`
4. basajja.budimbe collection → Raw JSON data via `extract_budimbe_data.js`
5. basajja.budimbe collection → Focused HTML report via `generate_budimbe_report.js`

This workflow allows you to maintain your family tree data in Excel, import it to MongoDB, and generate various reports and visualizations. The new scripts focus specifically on extracting and visualizing data from the basajja.budimbe collection without using add_user.js for missing data.