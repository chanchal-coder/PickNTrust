#!/usr/bin/env python3

import os
import sys
from app import app

if __name__ == '__main__':
    print("Starting Flask Product Extractor...")
    print("Visit http://localhost:3000 to use the product extractor")
    app.run(debug=True, host='0.0.0.0', port=3000)