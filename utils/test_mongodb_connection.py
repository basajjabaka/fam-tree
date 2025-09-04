import os
from pymongo import MongoClient
from rich.console import Console
from dotenv import load_dotenv

console = Console()

# Load environment variables
load_dotenv(".env")
dburi = os.getenv("MONGODB_URI")

# Check if MongoDB URI exists
if not dburi:
    console.print("[bold red]Error: MONGODB_URI environment variable not found or empty[/bold red]")
    exit(1)

console.print(f"[bold blue]Attempting to connect to MongoDB with URI: {dburi}[/bold blue]")

try:
    # Connect to MongoDB
    client = MongoClient(dburi, serverSelectionTimeoutMS=5000)
    
    # Test the connection
    client.admin.command('ping')
    
    console.print("[bold green]Successfully connected to MongoDB![/bold green]")
    
    # Print database information
    db_names = client.list_database_names()
    console.print(f"[bold cyan]Available databases: {db_names}[/bold cyan]")
    
    # Check if the specific database and collection exist
    db_name = "basajja"
    collection_name = "budimbe"
    
    if db_name in db_names:
        db = client[db_name]
        collection_names = db.list_collection_names()
        console.print(f"[bold cyan]Collections in {db_name}: {collection_names}[/bold cyan]")
        
        if collection_name in collection_names:
            console.print(f"[bold green]Collection '{collection_name}' exists![/bold green]")
            # Count documents in the collection
            count = db[collection_name].count_documents({})
            console.print(f"[bold cyan]Number of documents in '{collection_name}': {count}[/bold cyan]")
        else:
            console.print(f"[bold yellow]Collection '{collection_name}' does not exist in database '{db_name}'[/bold yellow]")
    else:
        console.print(f"[bold yellow]Database '{db_name}' does not exist[/bold yellow]")
        
except Exception as e:
    console.print(f"[bold red]Error connecting to MongoDB: {e}[/bold red]")
    exit(1)
finally:
    # Close the connection
    if 'client' in locals():
        client.close()
        console.print("[bold blue]MongoDB connection closed[/bold blue]")