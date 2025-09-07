const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const loadEnv = require('./loadEnv');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    return true;
  } catch (err) {
    console.error('Error connecting to DB:', err);
    return false;
  }
}

// Get collection name from environment variable or use default
const collectionName = process.env.COLLECTION_NAME || "Budimbe";

// Define the Member schema
const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date },
  phone: { type: String },
  image: { type: String },
  occupation: { type: String },
  address: { type: String },
  spouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionName,
    default: null
  },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: collectionName }],
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false
    }
  },
  about: { type: String }
});

const Member = mongoose.model(collectionName, MemberSchema, collectionName);

// Update the .env file with user IDs
async function updateEnvWithUserIds() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to the database');
    process.exit(1);
  }

  try {
    // Get all users from the database
    const allUsers = await Member.find({}).select('_id');
    
    if (allUsers.length === 0) {
      console.log('No users found in the database. VITE_USER_IDS will not be updated.');
      process.exit(0);
    }
    
    console.log(`Found ${allUsers.length} users in the database`);
    
    // Create a comma-separated string of user IDs
    const userIdsString = allUsers.map(user => user._id.toString()).join(',');
    
    // Read the .env file
    const envFilePath = path.resolve(__dirname, '../.env');
    let envContent = fs.readFileSync(envFilePath, 'utf8');
    
    // Check if VITE_USER_IDS already exists in the .env file
    const viteUserIdsRegex = /(VITE_USER_IDS=)(.*)$/m;
    
    if (viteUserIdsRegex.test(envContent)) {
      // Update the existing VITE_USER_IDS
      envContent = envContent.replace(viteUserIdsRegex, `$1"${userIdsString}"`);
      console.log('Updated existing VITE_USER_IDS in .env file');
    } else {
      // Add VITE_USER_IDS if it doesn't exist
      envContent += `\nVITE_USER_IDS="${userIdsString}"\n`;
      console.log('Added VITE_USER_IDS to .env file');
    }
    
    // Write the updated content back to the .env file
    fs.writeFileSync(envFilePath, envContent);
    
    console.log('Successfully updated .env file with user IDs');
    process.exit(0);
  } catch (error) {
    console.error('Error updating .env file:', error);
    process.exit(1);
  }
}

// Run the function
updateEnvWithUserIds();