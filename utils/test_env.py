import os
from dotenv import load_dotenv
from rich.console import Console

console = Console()

# Try loading from different paths
paths = [
    ".env",
    "../.env",
    os.path.join(os.path.dirname(__file__), "../.env"),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../.env"))
]

console.print(f"[yellow]Current working directory: {os.getcwd()}[/yellow]")

for path in paths:
    console.print(f"\n[blue]Trying to load .env from: {path}[/blue]")
    try:
        load_dotenv(path)
        mongodb_uri = os.getenv("MONGODB_URI")
        if mongodb_uri:
            console.print(f"[green]Success! MONGODB_URI found: {mongodb_uri[:20]}...[/green]")
            console.print(f"[green]Full path that worked: {os.path.abspath(path) if os.path.exists(path) else path}[/green]")
        else:
            console.print(f"[red]Loaded .env file but MONGODB_URI is not set[/red]")
    except Exception as e:
        console.print(f"[red]Error loading .env from {path}: {str(e)}[/red]")

# Print all environment variables for debugging
console.print("\n[yellow]All environment variables:[/yellow]")
for key, value in os.environ.items():
    if key.startswith("MONGODB") or key.startswith("DB_"):
        console.print(f"[cyan]{key}[/cyan]: {value[:20]}..." if value and len(value) > 20 else f"[cyan]{key}[/cyan]: {value}")