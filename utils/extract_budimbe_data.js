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

async function extractBudimbeData() {
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
    
    // Extract and display raw data
    console.log('Raw Data from basajja.budimbe:');
    console.log('============================');
    
    members.forEach((member, index) => {
      console.log(`\nMember ${index + 1}:`);
      console.log(JSON.stringify(member, null, 2));
    });
    
    // Extract specific fields
    console.log('\n\nExtracted Fields:');
    console.log('================');
    
    const extractedData = members.map(member => {
      return {
        id: member._id,
        name: member.name,
        dob: member.dob,
        phone: member.phone,
        occupation: member.occupation,
        address: member.address,
        spouse: member.spouse,
        children: member.children,
        // Add any other fields you want to extract
      };
    });
    
    extractedData.forEach((data, index) => {
      console.log(`\nMember ${index + 1}:`);
      console.log(`ID: ${data.id}`);
      console.log(`Name: ${data.name || 'N/A'}`);
      console.log(`Date of Birth: ${data.dob ? new Date(data.dob).toLocaleDateString() : 'N/A'}`);
      console.log(`Phone: ${data.phone || 'N/A'}`);
      console.log(`Occupation: ${data.occupation || 'N/A'}`);
      console.log(`Address: ${data.address || 'N/A'}`);
      
      if (data.spouse) {
        const spouseMember = members.find(m => m._id.toString() === data.spouse.toString());
        console.log(`Spouse: ${spouseMember ? spouseMember.name : data.spouse}`);
      } else {
        console.log('Spouse: N/A');
      }
      
      if (data.children && data.children.length > 0) {
        const childrenNames = data.children
          .map(childId => {
            const child = members.find(m => m._id.toString() === childId.toString());
            return child ? child.name : childId;
          })
          .join(', ');
        console.log(`Children: ${childrenNames}`);
      } else {
        console.log('Children: None');
      }
    });
    
    // Save the extracted data to a file
    const outputData = {
      rawData: members,
      extractedData: extractedData
    };
    
    fs.writeFileSync(
      path.resolve(__dirname, 'budimbe_data.json'), 
      JSON.stringify(outputData, null, 2)
    );
    
    console.log('\nData has been saved to budimbe_data.json');
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the function
extractBudimbeData().catch(console.error);