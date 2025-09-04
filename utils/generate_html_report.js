import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function generateHtmlReport() {
  // MongoDB connection details from .env
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'basajja';
  const collectionName = process.env.COLLECTION_NAME?.split('.')[1] || 'budimbe';
  
  if (!uri) {
    console.error('Error: MONGODB_URI environment variable not found or empty');
    process.exit(1);
  }

  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    // Access the database and collection
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Find all members
    const members = await collection.find({}).toArray();
    
    if (members.length === 0) {
      console.log('No family members found in the database.');
      return;
    }
    
    console.log(`Found ${members.length} family members in the database.`);
    
    // Create a map of members by ID for easy lookup
    const membersMap = {};
    members.forEach(member => {
      membersMap[member._id.toString()] = member;
    });
    
    // Find root members (those without parents)
    const rootMembers = members.filter(member => {
      // A root member is one that has children but is not in any other member's children array
      return member.children && member.children.length > 0 && 
             !members.some(m => 
               m.children && 
               m.children.some(childId => childId.toString() === member._id.toString())
             );
    });
    
    // Generate HTML content
    const htmlContent = generateHtml(rootMembers, members, membersMap);
    
    // Write HTML to file
    const outputPath = path.resolve(__dirname, 'family_tree_report.html');
    fs.writeFileSync(outputPath, htmlContent);
    
    console.log(`HTML report generated at: ${outputPath}`);
    
  } catch (error) {
    console.error('Error generating HTML report:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

function generateHtml(rootMembers, allMembers, membersMap) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Family Tree Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9f9f9;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    .section {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 30px;
    }
    .tree-container {
      margin-left: 20px;
    }
    .tree-node {
      margin-bottom: 10px;
    }
    .tree-node-content {
      display: inline-block;
      padding: 5px 10px;
      background-color: #3498db;
      color: white;
      border-radius: 4px;
      margin-bottom: 5px;
    }
    .tree-children {
      margin-left: 30px;
      position: relative;
    }
    .tree-children::before {
      content: '';
      position: absolute;
      top: 0;
      left: -15px;
      border-left: 1px solid #ccc;
      height: 100%;
    }
    .tree-node-spouse {
      display: inline-block;
      margin-left: 10px;
      padding: 5px 10px;
      background-color: #e74c3c;
      color: white;
      border-radius: 4px;
    }
    .member-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 15px;
      margin-bottom: 15px;
      border-left: 4px solid #3498db;
    }
    .member-name {
      font-size: 1.2em;
      font-weight: bold;
      margin-bottom: 10px;
      color: #2c3e50;
    }
    .member-details {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    .member-detail {
      margin-bottom: 5px;
    }
    .detail-label {
      font-weight: bold;
      color: #7f8c8d;
    }
    .member-children {
      margin-top: 10px;
    }
    .member-spouse {
      color: #e74c3c;
      font-weight: bold;
    }
    .data-source {
      text-align: center;
      margin-top: 30px;
      font-style: italic;
      color: #7f8c8d;
    }
  </style>
</head>
<body>
  <h1>Family Tree Report</h1>
  
  <div class="section">
    <h2>Family Hierarchy</h2>
    <div class="tree-container">
      ${generateTreeHtml(rootMembers, membersMap)}
    </div>
  </div>
  
  <div class="section">
    <h2>Detailed Family Information</h2>
    ${generateDetailedInfoHtml(allMembers, membersMap)}
  </div>
  
  <div class="data-source">
    Data source: MongoDB collection '${process.env.COLLECTION_NAME}' loaded from utils/sample_data.xlsx
  </div>
</body>
</html>
  `;
}

function generateTreeHtml(members, membersMap) {
  if (!members || members.length === 0) return '<p>No family hierarchy data available.</p>';
  
  return members.map(member => {
    const spouseHtml = member.spouse && membersMap[member.spouse.toString()] ?
      `<span class="tree-node-spouse">${membersMap[member.spouse.toString()].name}</span>` : '';
    
    let childrenHtml = '';
    if (member.children && member.children.length > 0) {
      const childMembers = member.children
        .map(childId => membersMap[childId.toString()])
        .filter(Boolean);
      
      if (childMembers.length > 0) {
        childrenHtml = `
          <div class="tree-children">
            ${generateTreeHtml(childMembers, membersMap)}
          </div>
        `;
      }
    }
    
    return `
      <div class="tree-node">
        <div class="tree-node-content">${member.name}</div>${spouseHtml}
        ${childrenHtml}
      </div>
    `;
  }).join('');
}

function generateDetailedInfoHtml(members, membersMap) {
  if (!members || members.length === 0) return '<p>No family members data available.</p>';
  
  return members.map(member => {
    const spouseInfo = member.spouse && membersMap[member.spouse.toString()] ?
      `<div class="member-detail"><span class="detail-label">Spouse:</span> <span class="member-spouse">${membersMap[member.spouse.toString()].name}</span></div>` : '';
    
    let childrenInfo = '';
    if (member.children && member.children.length > 0) {
      const childrenNames = member.children
        .map(childId => membersMap[childId.toString()]?.name || 'Unknown')
        .join(', ');
      
      childrenInfo = `
        <div class="member-children">
          <span class="detail-label">Children:</span> ${childrenNames}
        </div>
      `;
    }
    
    return `
      <div class="member-card">
        <div class="member-name">${member.name}</div>
        <div class="member-details">
          ${member.dob ? `<div class="member-detail"><span class="detail-label">Date of Birth:</span> ${new Date(member.dob).toLocaleDateString()}</div>` : ''}
          ${member.phone ? `<div class="member-detail"><span class="detail-label">Phone:</span> ${member.phone}</div>` : ''}
          ${member.occupation ? `<div class="member-detail"><span class="detail-label">Occupation:</span> ${member.occupation}</div>` : ''}
          ${member.address ? `<div class="member-detail"><span class="detail-label">Address:</span> ${member.address}</div>` : ''}
          ${spouseInfo}
        </div>
        ${childrenInfo}
      </div>
    `;
  }).join('');
}

// Run the function
generateHtmlReport().catch(console.error);