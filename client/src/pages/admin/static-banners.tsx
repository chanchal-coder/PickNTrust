import { useState } from 'react';
import StaticBannerAdmin from '@/components/StaticBannerAdmin';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function StaticBannersAdmin() {
  const [saveStatus, setSaveStatus] = useState<string>('');

  const handleSave = (config: any) => {
    setSaveStatus('Configuration saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Static Banner Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage website banners without API dependency - crash-proof and reliable!
          </p>
          {saveStatus && (
            <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
              {saveStatus}
            </div>
          )}
        </div>
        
        <StaticBannerAdmin onSave={handleSave} />
      </main>
      
      <Footer />
    </div>
  );
}
