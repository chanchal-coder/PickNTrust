cat > client/src/App.tsx << 'EOF'
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Link } from "wouter";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">PickNTrust</h1>
          <p className="text-gray-600">Your trusted e-commerce platform</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome to PickNTrust</h2>
          <p className="text-gray-600 mb-4">
            Your website is now fully operational!
          </p>
          <div className="space-y-4">
            <Link href="/products">
              <a className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Browse Products
              </a>
            </Link>
            <Link href="/admin">
              <a className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 ml-4">
                Admin Panel
              </a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
EOF
