#!/usr/bin/env python3
"""
Simple startup script for the vision service.
This will run the Flask app on port 8080.
"""

import os
import sys

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from main import app
    
    if __name__ == '__main__':
        print("🔍 Starting Dakota Vision Service...")
        print("📊 Vision analysis running on http://localhost:8080")
        print("🔬 Ready to process images and detect emotions")
        app.run(host='0.0.0.0', port=8080, debug=True)
        
except ImportError as e:
    print(f"❌ Error importing required modules: {e}")
    print("💡 Please install dependencies with: pip install -r requirements.txt")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error starting vision service: {e}")
    sys.exit(1)