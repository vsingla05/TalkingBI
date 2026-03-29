"""
JSON Serialization Utilities
Handles NaN, Inf, and other non-JSON-serializable values
"""

import json
import math
import numpy as np
import pandas as pd


def clean_for_json(obj):
    """Recursively clean NaN, Inf, and other non-JSON-serializable values"""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, (np.integer, np.floating)):
        if isinstance(obj, np.floating) and (np.isnan(obj) or np.isinf(obj)):
            return None
        return float(obj) if isinstance(obj, np.floating) else int(obj)
    elif isinstance(obj, np.ndarray):
        return clean_for_json(obj.tolist())
    elif isinstance(obj, pd.Series):
        return clean_for_json(obj.to_list())
    elif isinstance(obj, pd.DataFrame):
        return clean_for_json(obj.to_dict(orient='records'))
    elif isinstance(obj, (np.bool_,)):
        return bool(obj)
    return obj


class NaNSafeEncoder(json.JSONEncoder):
    """JSON encoder that handles NaN, Inf, and numpy types"""
    
    def default(self, o):
        if isinstance(o, float):
            if math.isnan(o) or math.isinf(o):
                return None
        elif isinstance(o, (np.integer, np.floating)):
            if isinstance(o, np.floating) and (np.isnan(o) or np.isinf(o)):
                return None
            return float(o) if isinstance(o, np.floating) else int(o)
        elif isinstance(o, np.ndarray):
            return o.tolist()
        elif isinstance(o, (np.bool_,)):
            return bool(o)
        elif isinstance(o, pd.Series):
            return o.to_list()
        elif isinstance(o, pd.DataFrame):
            return o.to_dict(orient='records')
        return super().default(o)
