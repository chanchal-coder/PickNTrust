#!/usr/bin/env python3
import subprocess
import sys
import os
import time

def start_flask_service():
    """Start the Flask extraction service on port 3000"""
    try:
        # Start Flask service in background
        process = subprocess.Popen([
            sys.executable, 'app.py'
        ], cwd=os.getcwd())
        
        print(f"Flask service started with PID: {process.pid}")
        
        # Wait a moment for service to start
        time.sleep(2)
        
        # Test if service is running
        import requests
        try:
            response = requests.get('http://localhost:3000/', timeout=5)
            print("Flask service is running successfully!")
            return True
        except:
            print("Flask service may not be responding yet...")
            return False
            
    except Exception as e:
        print(f"Error starting Flask service: {e}")
        return False

if __name__ == '__main__':
    start_flask_service()