import * as mongoose from 'mongoose';

async function verifyEmailIndex() {
  const uri = 'mongodb+srv://usman:Usman%40123@cluster0.jyo22pp.mongodb.net/nestAuth';
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const UserSchema = new mongoose.Schema({
        email: { type: String, unique: true, index: true },
        name: { type: String, index: true },
        isVerified: { type: Boolean, index: true }
    }, { collection: 'users' });

    const UserModel = mongoose.model('User', UserSchema);

    console.log('--- Current Indexes via Mongoose ---');
    const indexes = await UserModel.collection.getIndexes();
    console.log(JSON.stringify(indexes, null, 2));

    console.log('\n--- Query Explain Plan for Email Search ---');
    const explain = await UserModel.find({ email: 'ali@gmail.com' }).explain('executionStats');
    
    // Check if it uses IXSCAN (Index Scan) instead of COLLSCAN (Collection Scan)
    const winningPlan = (explain as any).queryPlanner.winningPlan;
    const isIndexScan = JSON.stringify(winningPlan).includes('IXSCAN');
    
    console.log(`\nResult -> Winning Plan Type: ${isIndexScan ? 'IXSCAN (SUCCESS - Index used)' : 'COLLSCAN (FAILURE - Index NOT used)'}`);
    
    if (isIndexScan) {
        console.log('Confirmed: MongoDB is using the index to look up the email directly.');
    } else {
        console.log('Warning: MongoDB is scanning the entire collection. The index may still be building or was not created.');
    }

  } catch (error) {
    console.error('Error verifying index:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyEmailIndex();
