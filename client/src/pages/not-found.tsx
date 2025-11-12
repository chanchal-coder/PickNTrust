import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import UniversalPageLayout from '@/components/UniversalPageLayout';

export default function NotFound() {
  return (
    <UniversalPageLayout pageId="not-found">
            <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1220', color: '#fff' }}>
              <Card className="w-full max-w-md mx-4">
                <CardContent className="pt-6">
                  <div className="flex mb-4 gap-2 items-center">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                    <h1 className="text-2xl font-bold">404 Page Not Found</h1>
                  </div>
                  <p className="mt-4 text-sm text-gray-300">
                    Did you forget to add the page to the router?
                  </p>
                </CardContent>
              </Card>
            </div>
    </UniversalPageLayout>
  );
}
