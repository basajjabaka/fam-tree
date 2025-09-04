const loadEnv = require('./loadEnv');
const mongoose = require('mongoose');
const { Schema } = mongoose;

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Get collection name from environment variable or use default
    const collectionName = process.env.COLLECTION_NAME || "Budimbe";
    
    const MemberSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  dob: Date,
  phone: String,
  occupation: String,
  address: String,
  image: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  },
  spouse: { type: mongoose.Schema.Types.ObjectId, ref: collectionName },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: collectionName }]
});

const Member = mongoose.model(collectionName, MemberSchema);

const member = await Member.findById('68a2ea0a133fed213b1bbff3');
    console.log(JSON.stringify(member, null, 2));
    
    await mongoose.connection.close();
    console.log('DB connection closed');
  } catch (err) {
    console.error('Error:', err);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  }
}

checkUser();