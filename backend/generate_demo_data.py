#!/usr/bin/env python3
"""
Demo Data Generator for TalkingBI
Generates sample CSV files for testing
"""

import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import random

def generate_sales_data():
    """Generate sample sales data"""
    data = {
        'date': pd.date_range(start='2024-01-01', end='2024-12-31', freq='D'),
        'region': ['North', 'South', 'East', 'West'] * 91 + ['North', 'South', 'East', 'West'][:1],
        'sales': [random.uniform(5000, 50000) for _ in range(365)],
        'units': [random.randint(10, 500) for _ in range(365)],
    }
    df = pd.DataFrame(data)
    df['revenue'] = df['sales'] * df['units']
    return df

def generate_customer_data():
    """Generate sample customer data"""
    data = {
        'customer_id': range(1, 501),
        'age': [random.randint(18, 80) for _ in range(500)],
        'segment': [random.choice(['Premium', 'Standard', 'Basic']) for _ in range(500)],
        'annual_spend': [random.uniform(500, 50000) for _ in range(500)],
        'lifetime_value': [random.uniform(1000, 100000) for _ in range(500)],
        'join_date': [datetime.now() - timedelta(days=random.randint(1, 1000)) for _ in range(500)],
    }
    return pd.DataFrame(data)

def generate_performance_data():
    """Generate system performance data"""
    data = {
        'timestamp': pd.date_range(start='2024-01-01', periods=168, freq='H'),
        'cpu_usage': [random.uniform(10, 80) for _ in range(168)],
        'memory_usage': [random.uniform(20, 90) for _ in range(168)],
        'response_time': [random.uniform(100, 500) for _ in range(168)],
        'error_rate': [random.uniform(0.01, 2) for _ in range(168)],
        'requests': [random.randint(100, 10000) for _ in range(168)],
    }
    return pd.DataFrame(data)

def generate_marketing_data():
    """Generate marketing campaign data"""
    data = {
        'campaign': ['Email', 'Social', 'Search', 'Display'] * 25,
        'date': pd.date_range(start='2024-01-01', periods=100),
        'impressions': [random.randint(1000, 100000) for _ in range(100)],
        'clicks': [random.randint(10, 5000) for _ in range(100)],
        'conversions': [random.randint(1, 500) for _ in range(100)],
        'spend': [random.uniform(100, 5000) for _ in range(100)],
    }
    return pd.DataFrame(data)

def main():
    """Generate all demo data"""
    output_dir = Path('sample_data')
    output_dir.mkdir(exist_ok=True)
    
    print("Generating sample datasets...")
    
    # Generate all datasets
    datasets = {
        'sales_data.csv': generate_sales_data(),
        'customer_data.csv': generate_customer_data(),
        'performance_data.csv': generate_performance_data(),
        'marketing_data.csv': generate_marketing_data(),
    }
    
    for filename, df in datasets.items():
        filepath = output_dir / filename
        df.to_csv(filepath, index=False)
        print(f"✓ Created {filepath} ({len(df)} rows)")
    
    print(f"\nAll datasets created in {output_dir}/")
    print("Use these URLs or paths to test TalkingBI dashboards!")

if __name__ == '__main__':
    main()
