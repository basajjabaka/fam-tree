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

const Member = mongoose.model(collectionName, MemberSchema);

// Add all users from the .env file
async function addUser() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to the database');
    process.exit(1);
  }

  try {
    // Get user IDs from .env
    const userIds = process.env.VITE_USER_IDS ? process.env.VITE_USER_IDS.split(',').map(id => id.trim()) : [];
    
    if (userIds.length === 0) {
      console.error('No user IDs found in VITE_USER_IDS environment variable');
      process.exit(1);
    }
    
    console.log(`Found ${userIds.length} user IDs in VITE_USER_IDS`);
    
    // Check if any users already exist in the database
    const existingUsers = await Member.find({ _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } });
    
    if (existingUsers.length > 0) {
      console.log(`${existingUsers.length} users already exist in the database. No new users will be created.`);
      process.exit(0);
    }
    
    console.log('No existing users found. Creating new users...');
    
    // Create users for each ID
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      
      // Create a new user
      const user = new Member({
        _id: new mongoose.Types.ObjectId(userId),
        name: `Family Member ${i + 1}`,
        dob: new Date(1900 + i, 0, 1 + i),
        phone: `12345678${i}`,
        occupation: `Occupation ${i + 1}`,
        address: `Address ${i + 1}, Street ${i + 1}`,
        image: 'http://res.cloudinary.com/basajja/image/upload/IMG_3457',
        spouse: i < userIds.length - 1 ? new mongoose.Types.ObjectId(userIds[i + 1]) : null,
        children: []
      });
      
      await user.save();
      console.log(`User with ID ${userId} added successfully`);
    }
    
    // Update relationships
    const allUsers = await Member.find({});
    for (const user of allUsers) {
      if (user.spouse) {
        const spouse = await Member.findById(user.spouse);
        if (spouse && !spouse.spouse) {
          spouse.spouse = user._id;
          await spouse.save();
          console.log(`Updated spouse relationship for ${spouse.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Error adding user:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Commented out to ensure only data from basajja.budimbe is outputted
// addUser();