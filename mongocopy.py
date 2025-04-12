import pymongo
import os
import logging
import time
from dotenv import load_dotenv
import sys
from tqdm import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mongodb_migration.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def test_connection(uri, db_name):
    """Test MongoDB connection before starting migration"""
    client = None
    try:
        client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client[db_name]
        collections = db.list_collection_names()
        logger.info(f"Connection to {uri} successful. Found {len(collections)} collections.")
        return True
    except Exception as e:
        logger.error(f"Connection to {uri} failed: {str(e)}")
        return False
    finally:
        if client:
            client.close()

def migrate_mongodb_data(source_uri, target_uri, db_name, batch_size=1000):
    """
    Migrate all collections and data from source MongoDB to target MongoDB
    using batched processing for better memory efficiency
    """
    start_time = time.time()
    
    # Test connections first
    logger.info("Testing database connections...")
    if not test_connection(source_uri, db_name):
        logger.error("Failed to connect to source database.")
        return False
        
    if not test_connection(target_uri, db_name):
        logger.error("Failed to connect to target database.")
        return False
    
    try:
        # Connect to source MongoDB
        logger.info(f"Connecting to source database: {source_uri}")
        source_client = pymongo.MongoClient(source_uri)
        source_db = source_client[db_name]
        
        # Connect to target MongoDB
        logger.info(f"Connecting to target database: {target_uri}")
        target_client = pymongo.MongoClient(target_uri)
        target_db = target_client[db_name]
        
        # Get all collections from source database
        collections = source_db.list_collection_names()
        logger.info(f"Found {len(collections)} collections in source database")
        
        # Migrate each collection
        for collection_name in collections:
            logger.info(f"Starting migration for collection: {collection_name}")
            
            # Get source collection
            source_collection = source_db[collection_name]
            
            # Get target collection
            target_collection = target_db[collection_name]
            
            # Count documents (for progress tracking)
            total_docs = source_collection.count_documents({})
            logger.info(f"Found {total_docs} documents in {collection_name}")
            
            if total_docs > 0:
                # Delete existing documents in target collection
                logger.info(f"Clearing existing documents in target collection: {collection_name}")
                target_collection.delete_many({})
                
                # Copy indexes
                logger.info(f"Copying indexes for collection: {collection_name}")
                indexes = source_collection.index_information()
                for index_name, index_info in indexes.items():
                    # Skip the default _id index
                    if index_name != '_id_':
                        keys = index_info['key']
                        options = {k: v for k, v in index_info.items() 
                                  if k != 'key' and k != 'v' and k != 'ns'}
                        target_collection.create_index(keys, **options)
                
                # Process in batches using cursor for memory efficiency
                cursor = source_collection.find({})
                batch = []
                migrated_count = 0
                
                with tqdm(total=total_docs, desc=f"Migrating {collection_name}", unit="docs") as pbar:
                    for doc in cursor:
                        batch.append(doc)
                        
                        if len(batch) >= batch_size:
                            try:
                                target_collection.insert_many(batch)
                                migrated_count += len(batch)
                                pbar.update(len(batch))
                                batch = []
                            except Exception as e:
                                logger.error(f"Error inserting batch: {str(e)}")
                                # Try inserting one by one for this batch
                                for doc in batch:
                                    try:
                                        target_collection.insert_one(doc)
                                        migrated_count += 1
                                        pbar.update(1)
                                    except Exception as doc_e:
                                        logger.error(f"Failed to insert document: {str(doc_e)}")
                                batch = []
                    
                    # Insert any remaining documents
                    if batch:
                        try:
                            target_collection.insert_many(batch)
                            migrated_count += len(batch)
                            pbar.update(len(batch))
                        except Exception as e:
                            logger.error(f"Error inserting final batch: {str(e)}")
                            # Try inserting one by one for the final batch
                            for doc in batch:
                                try:
                                    target_collection.insert_one(doc)
                                    migrated_count += 1
                                    pbar.update(1)
                                except Exception as doc_e:
                                    logger.error(f"Failed to insert document: {str(doc_e)}")
                
                # Verify counts
                target_count = target_collection.count_documents({})
                if target_count == total_docs:
                    logger.info(f"Successfully migrated all {total_docs} documents to {collection_name}")
                else:
                    logger.warning(f"Collection {collection_name}: Source has {total_docs} docs, target has {target_count} docs")
            else:
                logger.info(f"No documents found in {collection_name}")
        
        end_time = time.time()
        duration = end_time - start_time
        logger.info(f"Migration completed successfully in {duration:.2f} seconds!")
        
    except Exception as e:
        logger.error(f"Error during migration: {str(e)}", exc_info=True)
        return False
    finally:
        # Close connections
        if 'source_client' in locals():
            source_client.close()
        if 'target_client' in locals():
            target_client.close()
    
    return True

if __name__ == "__main__":
    # Load environment variables from .env file
    load_dotenv()
    
    # Get MongoDB URIs from environment variables or command line
    if len(sys.argv) >= 4:
        source_uri = sys.argv[1]
        target_uri = sys.argv[2]
        db_name = sys.argv[3]
        # Optional batch size
        batch_size = int(sys.argv[4]) if len(sys.argv) >= 5 else 1000
    else:
        source_uri = os.getenv("SOURCE_MONGO_URI")
        target_uri = os.getenv("TARGET_MONGO_URI")
        db_name = os.getenv("DB_NAME")
        batch_size = int(os.getenv("BATCH_SIZE", "1000"))
        
        if not source_uri or not target_uri or not db_name:
            logger.error("MongoDB URIs and database name not provided.")
            print("Usage:")
            print("  Option 1: Set SOURCE_MONGO_URI, TARGET_MONGO_URI and DB_NAME in .env file")
            print("  Option 2: Run script with arguments: python mongocopy.py <SOURCE_URI> <TARGET_URI> <DB_NAME> [BATCH_SIZE]")
            sys.exit(1)
    
    # Run migration
    logger.info(f"Starting migration from {source_uri} to {target_uri} for database: {db_name}")
    migrate_mongodb_data(source_uri, target_uri, db_name, batch_size)