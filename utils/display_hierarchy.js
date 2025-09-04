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

async function displayFamilyHierarchy() {
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
    
    console.log(`Found ${members.length} family members in the database.\n`);
    
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
    
    console.log('Family Hierarchy:');
    console.log('=================');
    
    // Display the hierarchy starting from root members
    if (rootMembers.length > 0) {
      rootMembers.forEach(rootMember => {
        displayMemberHierarchy(rootMember, membersMap, 0);
      });
    } else {
      // If no clear root members, just display all members
      console.log('No clear family hierarchy found. Displaying all members:');
      members.forEach(member => {
        console.log(`- ${member.name}`);
      });
    }
    
    // Generate a detailed report
    console.log('\n\nDetailed Family Information:');
    console.log('===========================');
    
    members.forEach(member => {
      console.log(`\nName: ${member.name}`);
      if (member.dob) console.log(`Date of Birth: ${new Date(member.dob).toLocaleDateString()}`);
      if (member.phone) console.log(`Phone: ${member.phone}`);
      if (member.occupation) console.log(`Occupation: ${member.occupation}`);
      if (member.address) console.log(`Address: ${member.address}`);
      
      if (member.spouse && membersMap[member.spouse.toString()]) {
        console.log(`Spouse: ${membersMap[member.spouse.toString()].name}`);
      }
      
      if (member.children && member.children.length > 0) {
        const childrenNames = member.children
          .map(childId => membersMap[childId.toString()]?.name || 'Unknown')
          .join(', ');
        console.log(`Children: ${childrenNames}`);
      }
      
      console.log('---');
    });
    
    // Save the data to a file
    const outputData = {
      hierarchy: generateHierarchyData(rootMembers, membersMap),
      detailedInfo: members.map(member => ({
        name: member.name,
        dob: member.dob ? new Date(member.dob).toLocaleDateString() : null,
        phone: member.phone || null,
        occupation: member.occupation || null,
        address: member.address || null,
        spouse: member.spouse ? membersMap[member.spouse.toString()]?.name : null,
        children: member.children ? member.children.map(childId => 
          membersMap[childId.toString()]?.name || 'Unknown') : []
      }))
    };
    
    fs.writeFileSync(
      path.resolve(__dirname, 'family_data_output.json'), 
      JSON.stringify(outputData, null, 2)
    );
    
    console.log('\nData has been saved to family_data_output.json');
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Recursive function to display member hierarchy
function displayMemberHierarchy(member, membersMap, level) {
  const indent = '  '.repeat(level);
  const spouseInfo = member.spouse && membersMap[member.spouse.toString()] ? 
    ` (Spouse: ${membersMap[member.spouse.toString()].name})` : '';
  
  console.log(`${indent}- ${member.name}${spouseInfo}`);
  
  // Display children
  if (member.children && member.children.length > 0) {
    member.children.forEach(childId => {
      const childMember = membersMap[childId.toString()];
      if (childMember) {
        displayMemberHierarchy(childMember, membersMap, level + 1);
      }
    });
  }
}

// Function to generate hierarchy data for JSON output
function generateHierarchyData(members, membersMap, level = 0) {
  return members.map(member => {
    const result = {
      name: member.name,
      level: level
    };
    
    if (member.spouse && membersMap[member.spouse.toString()]) {
      result.spouse = membersMap[member.spouse.toString()].name;
    }
    
    if (member.children && member.children.length > 0) {
      const childMembers = member.children
        .map(childId => membersMap[childId.toString()])
        .filter(Boolean);
      
      result.children = generateHierarchyData(childMembers, membersMap, level + 1);
    }
    
    return result;
  });
}

// Run the function
displayFamilyHierarchy().catch(console.error);