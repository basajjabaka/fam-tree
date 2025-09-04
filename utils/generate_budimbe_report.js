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

async function generateBudimbeReport() {
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
    
    // Generate HTML content
    const htmlContent = generateHtml(members, membersMap);
    
    // Write HTML to file
    const outputPath = path.resolve(__dirname, 'budimbe_report.html');
    fs.writeFileSync(outputPath, htmlContent);
    
    console.log(`Budimbe report generated at: ${outputPath}`);
    
  } catch (error) {
    console.error('Error generating report:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

function generateHtml(members, membersMap) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Basajja Budimbe Family Data</title>
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
    .container {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }
    .section {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 20px;
      width: 100%;
    }
    .member-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 20px;
      width: calc(50% - 20px);
    }
    .member-card h3 {
      margin-top: 0;
      color: #3498db;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .member-info {
      margin-bottom: 15px;
    }
    .member-info strong {
      display: inline-block;
      width: 120px;
      color: #7f8c8d;
    }
    .family-tree {
      margin-top: 20px;
    }
    .family-tree ul {
      list-style-type: none;
      padding-left: 20px;
    }
    .family-tree > ul {
      padding-left: 0;
    }
    .family-tree li {
      margin-bottom: 10px;
      position: relative;
    }
    .family-tree li::before {
      content: "";
      position: absolute;
      top: 0;
      left: -15px;
      border-left: 1px solid #ccc;
      height: 100%;
    }
    .family-tree li:last-child::before {
      height: 15px;
    }
    .family-tree li::after {
      content: "";
      position: absolute;
      top: 15px;
      left: -15px;
      border-top: 1px solid #ccc;
      width: 15px;
    }
    .family-tree > ul > li::before,
    .family-tree > ul > li::after {
      display: none;
    }
    .member-image {
      max-width: 150px;
      max-height: 150px;
      border-radius: 5px;
      margin-bottom: 10px;
      display: block;
    }
    .image-container {
      float: right;
      margin-left: 20px;
    }
    .clearfix::after {
      content: "";
      clear: both;
      display: table;
    }
    @media (max-width: 768px) {
      .member-card {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <h1>Basajja Budimbe Family Data</h1>
  
  <div class="section">
    <h2>Family Overview</h2>
    <p>Total family members: ${members.length}</p>
    <p>Database: ${process.env.DB_NAME || 'basajja'}</p>
    <p>Collection: ${process.env.COLLECTION_NAME || 'basajja.budimbe'}</p>
  </div>

  <h2>Family Members</h2>
  <div class="container">
    ${members.map(member => `
      <div class="member-card clearfix">
        ${member.image ? `
        <div class="image-container">
          <img src="${member.image}" alt="${member.name}" class="member-image">
        </div>` : ''}
        <h3>${member.name || 'Unknown'}</h3>
        <div class="member-info">
          <p><strong>ID:</strong> ${member._id}</p>
          <p><strong>Date of Birth:</strong> ${member.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Phone:</strong> ${member.phone || 'N/A'}</p>
          <p><strong>Occupation:</strong> ${member.occupation || 'N/A'}</p>
          <p><strong>Address:</strong> ${member.address || 'N/A'}</p>
          
          ${member.spouse ? `
          <p><strong>Spouse:</strong> ${membersMap[member.spouse.toString()] ? membersMap[member.spouse.toString()].name : member.spouse}</p>` : `
          <p><strong>Spouse:</strong> N/A</p>`}
          
          ${member.children && member.children.length > 0 ? `
          <p><strong>Children:</strong></p>
          <ul>
            ${member.children.map(childId => {
              const child = membersMap[childId.toString()];
              return `<li>${child ? child.name : childId}</li>`;
            }).join('')}
          </ul>` : `
          <p><strong>Children:</strong> None</p>`}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>Family Tree</h2>
    <div class="family-tree">
      ${generateFamilyTree(members, membersMap)}
    </div>
  </div>

  <div class="section">
    <h2>Data Source</h2>
    <p>This report was generated from the MongoDB database using the basajja.budimbe collection.</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;
}

function generateFamilyTree(members, membersMap) {
  // Find root members (those without parents)
  const rootMembers = members.filter(member => {
    // A root member is one that has children but is not in any other member's children array
    return member.children && member.children.length > 0 && 
           !members.some(m => 
             m.children && 
             m.children.some(childId => childId.toString() === member._id.toString())
           );
  });

  if (rootMembers.length === 0) {
    return '<p>No clear family hierarchy found.</p>';
  }

  return `
    <ul>
      ${rootMembers.map(member => renderFamilyMember(member, membersMap)).join('')}
    </ul>
  `;
}

function renderFamilyMember(member, membersMap) {
  const spouseInfo = member.spouse && membersMap[member.spouse.toString()] ? 
    ` (Spouse: ${membersMap[member.spouse.toString()].name})` : '';

  let html = `<li><strong>${member.name}</strong>${spouseInfo}`;

  if (member.children && member.children.length > 0) {
    html += `
      <ul>
        ${member.children.map(childId => {
          const child = membersMap[childId.toString()];
          return child ? renderFamilyMember(child, membersMap) : `<li>Unknown Child (${childId})</li>`;
        }).join('')}
      </ul>
    `;
  }

  html += '</li>';
  return html;
}

// Run the function
generateBudimbeReport().catch(console.error);