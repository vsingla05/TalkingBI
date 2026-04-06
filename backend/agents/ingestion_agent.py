"""
AGENT 0: Data Ingestion
────────────────────────
Fetches a CSV from a URL, validates it, and returns a cleaned Pandas DataFrame.
Handles common URL patterns including Google Sheets sharing links.
"""

import io
import os
import re
import requests
import pandas as pd


def _normalize_google_sheets_url(url: str) -> str:
    """Convert a Google Sheets share URL to a direct CSV export URL."""
    pattern = r"https://docs\.google\.com/spreadsheets/d/([a-zA-Z0-9_-]+)"
    match = re.search(pattern, url)
    if match:
        sheet_id = match.group(1)
        return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    return url


def fetch_dataset(dataset_url: str, timeout: int = 30) -> pd.DataFrame:
    """
    Fetch a CSV from `dataset_url` and return a Pandas DataFrame.

    Supported sources:
    - Public CSV direct links (http/https)
    - Google Sheets sharing links (auto-converted to export URL)

    Raises:
        ValueError: on HTTP errors, empty data, or parse failures.
    """
    if dataset_url.startswith("local://"):
        file_path = dataset_url.replace("local://", "")
        if not os.path.exists(file_path):
            raise ValueError(f"Local uploaded file not found: {file_path}")
        try:
            # Try UTF-8 first, then fall back to latin-1 and iso-8859-1
            encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
            df = None
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, encoding=encoding)
                    break
                except (UnicodeDecodeError, UnicodeError):
                    continue
            
            if df is None:
                raise ValueError("Could not decode file with any supported encoding")
            
            if df.empty:
                raise ValueError("Uploaded dataset is empty (0 rows after parsing).")
            print(f"✅ Ingested dataset: {df.shape[0]} rows × {df.shape[1]} cols from local file")
            return df
        except Exception as e:
            raise ValueError(f"Failed to parse CSV content: {e}")

    if dataset_url.startswith(("postgresql://", "postgres://", "mysql://", "mysql+pymysql://", "sqlite://", "mssql+pyodbc://")):
        from sqlalchemy import create_engine, inspect
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        
        parsed_url = urlparse(dataset_url)
        query_params = parse_qs(parsed_url.query)
        table_name = query_params.get("table", [None])[0]
        
        if "table" in query_params:
            del query_params["table"]
        
        new_query = urlencode(query_params, doseq=True)
        new_url_parts = list(parsed_url)
        new_url_parts[4] = new_query
        clean_url = urlunparse(new_url_parts)
        
        try:
            engine = create_engine(clean_url)
            if not table_name:
                inspector = inspect(engine)
                tables = inspector.get_table_names()
                if not tables:
                    raise ValueError("No tables found in the database.")
                table_name = tables[0]
                print(f"No table specified, defaulting to first table found: {table_name}")
            
            df = pd.read_sql_table(table_name, engine)
            if df.empty:
                raise ValueError(f"Table '{table_name}' is empty.")
                
            print(f"✅ Ingested database: {df.shape[0]} rows × {df.shape[1]} cols from {parsed_url.scheme} (table: {table_name})")
            return df
        except Exception as e:
            raise ValueError(f"Failed to fetch data from database: {e}")

    if dataset_url.startswith(("mongodb://", "mongodb+srv://")):
        import pymongo
        from urllib.parse import urlparse, parse_qs
        
        parsed_url = urlparse(dataset_url)
        query_params = parse_qs(parsed_url.query)
        collection_name = query_params.get("collection", [None])[0]
        
        try:
            client = pymongo.MongoClient(dataset_url)
            db_name = parsed_url.path.strip("/")
            if not db_name:
                raise ValueError("Database name is required in the MongoDB URI (e.g. mongodb://host/dbname)")
                
            db = client[db_name]
            
            if not collection_name:
                collections = db.list_collection_names()
                if not collections:
                    raise ValueError(f"No collections found in database '{db_name}'.")
                collection_name = collections[0]
                print(f"No collection specified, defaulting to first collection found: {collection_name}")
                
            collection = db[collection_name]
            cursor = collection.find({}, {"_id": 0})
            docs = list(cursor)
            
            if not docs:
                raise ValueError(f"Collection '{collection_name}' is empty.")
                
            df = pd.json_normalize(docs)
            print(f"✅ Ingested MongoDB: {df.shape[0]} rows × {df.shape[1]} cols (db: {db_name}, collection: {collection_name})")
            return df
        except Exception as e:
            raise ValueError(f"Failed to fetch data from MongoDB: {e}")

    if not dataset_url.startswith(("http://", "https://")):
        raise ValueError(f"Invalid URL scheme: {dataset_url!r}. Must start with http://, https://, or a DB URI (postgresql://, mysql://, sqlite://, mongodb://)")

    url = _normalize_google_sheets_url(dataset_url)

    headers = {
        "User-Agent": "TalkingBI-DataAgent/1.0"
    }

    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise ValueError(f"Request timed out after {timeout}s fetching: {url}")
    except requests.exceptions.HTTPError as e:
        raise ValueError(f"HTTP error fetching dataset: {e}")
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Network error fetching dataset: {e}")

    content_type = response.headers.get("Content-Type", "")
    if "html" in content_type and "csv" not in content_type:
        # Likely a login page / redirect, not real data
        raise ValueError(
            "URL returned HTML instead of CSV. "
            "Ensure the URL is a direct CSV link or a publicly shared Google Sheet."
        )

    try:
        df = pd.read_csv(io.StringIO(response.text))
    except Exception as e:
        raise ValueError(f"Failed to parse CSV content: {e}")

    if df.empty:
        raise ValueError("Dataset is empty (0 rows after parsing).")

    print(f"✅ Ingested dataset: {df.shape[0]} rows × {df.shape[1]} cols from {url}")
    return df
