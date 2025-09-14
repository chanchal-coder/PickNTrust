// URL Processor Component
// Reusable component for processing any URL into product cards

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Link, CheckCircle, AlertCircle, ExternalLink, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface URLProcessorProps {
  targetPage: string;
  onProductAdded?: () => void;
  className?: string;
  showBulkInput?: boolean;
}

interface ProcessingStatus {
  step: number;
  totalSteps: number;
  currentStep: string;
  progress: number;
}

interface ProcessedProduct {
  success: boolean;
  originalUrl: string;
  productCard?: {
    name: string;
    price?: string | number;
    imageUrl: string;
    platform: string;
    affiliateUrl: string;
  };
  error?: string;
}

const URLProcessor: React.FC<URLProcessorProps> = ({ 
  targetPage, 
  onProductAdded, 
  className = '',
  showBulkInput = false 
}) => {
  const [url, setUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [processedProducts, setProcessedProducts] = useState<ProcessedProduct[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Single URL processing mutation
  const processSingleURL = useMutation({
    mutationFn: async (inputUrl: string) => {
      const response = await fetch('/api/process-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: inputUrl, 
          targetPage,
          saveToDatabase: true 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process URL');
      }
      
      return response.json();
    },
    onMutate: () => {
      setProcessingStatus({
        step: 1,
        totalSteps: 5,
        currentStep: 'Resolving URL...',
        progress: 20
      });
    },
    onSuccess: (data) => {
      setProcessingStatus(null);
      setProcessedProducts([data]);
      
      if (data.success) {
        toast({
          title: 'Product Added Successfully!',
          description: `${data.productCard?.name} has been added to ${targetPage}.`,
        });
        
        // Invalidate queries to refresh the page
        queryClient.invalidateQueries({ queryKey: [`/api/products/page/${targetPage}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/categories/page/${targetPage}`] });
        
        onProductAdded?.();
        setUrl('');
      } else {
        toast({
          title: 'Processing Failed',
          description: data.error || 'Failed to process the URL',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      setProcessingStatus(null);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process URL',
        variant: 'destructive',
      });
    },
  });

  // Bulk URL processing mutation
  const processBulkURLs = useMutation({
    mutationFn: async (urls: string[]) => {
      const response = await fetch('/api/process-bulk-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          urls, 
          targetPage,
          saveToDatabase: true 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process URLs');
      }
      
      return response.json();
    },
    onMutate: () => {
      setProcessingStatus({
        step: 1,
        totalSteps: 5,
        currentStep: 'Processing multiple URLs...',
        progress: 0
      });
    },
    onSuccess: (data) => {
      setProcessingStatus(null);
      setProcessedProducts(data.results || []);
      
      const successCount = data.successfullyProcessed || 0;
      const totalCount = data.totalUrls || 0;
      
      if (successCount > 0) {
        toast({
          title: 'Bulk Processing Complete!',
          description: `${successCount}/${totalCount} products added successfully to ${targetPage}.`,
        });
        
        // Invalidate queries to refresh the page
        queryClient.invalidateQueries({ queryKey: [`/api/products/page/${targetPage}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/categories/page/${targetPage}`] });
        
        onProductAdded?.();
        setBulkUrls('');
      } else {
        toast({
          title: 'Bulk Processing Failed',
          description: 'No URLs were processed successfully',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      setProcessingStatus(null);
      toast({
        title: 'Bulk Processing Error',
        description: error.message || 'Failed to process URLs',
        variant: 'destructive',
      });
    },
  });

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return;
    }
    
    // Simulate processing steps
    const steps = [
      { step: 1, text: 'Resolving URL...', progress: 20 },
      { step: 2, text: 'Detecting platform...', progress: 40 },
      { step: 3, text: 'Scraping product data...', progress: 60 },
      { step: 4, text: 'Converting to affiliate link...', progress: 80 },
      { step: 5, text: 'Creating product card...', progress: 100 }
    ];
    
    let currentStepIndex = 0;
    const stepInterval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        const currentStep = steps[currentStepIndex];
        setProcessingStatus({
          step: currentStep.step,
          totalSteps: 5,
          currentStep: currentStep.text,
          progress: currentStep.progress
        });
        currentStepIndex++;
      } else {
        clearInterval(stepInterval);
      }
    }, 800);
    
    processSingleURL.mutate(url.trim());
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = bulkUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);
    
    if (urls.length === 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter at least one valid URL',
        variant: 'destructive',
      });
      return;
    }
    
    processBulkURLs.mutate(urls);
  };

  const isProcessing = processSingleURL.isPending || processBulkURLs.isPending;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Add Products from Any URL
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Paste any product URL (Amazon, Flipkart, shortened links, etc.) to automatically create product cards
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Toggle */}
          {showBulkInput && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!isBulkMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsBulkMode(false)}
              >
                Single URL
              </Button>
              <Button
                type="button"
                variant={isBulkMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsBulkMode(true)}
              >
                Bulk URLs
              </Button>
            </div>
          )}

          {/* Single URL Input */}
          {!isBulkMode && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://amazon.in/dp/... or https://bit.ly/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isProcessing}
                  className="flex-1"
                />
                <Button type="submit" disabled={isProcessing || !url.trim()}>
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Product
                </Button>
              </div>
            </form>
          )}

          {/* Bulk URL Input */}
          {isBulkMode && (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <textarea
                placeholder="Paste multiple URLs (one per line):\nhttps://amazon.in/dp/...\nhttps://flipkart.com/...\nhttps://bit.ly/..."
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                disabled={isProcessing}
                className="w-full h-32 p-3 border rounded-md resize-none"
              />
              <Button type="submit" disabled={isProcessing || !bulkUrls.trim()}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Process All URLs
              </Button>
            </form>
          )}

          {/* Supported Platforms */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Supports:</span>
            {['Amazon', 'Flipkart', 'Nykaa', 'Myntra', 'Boat', 'Mamaearth', 'bit.ly', 'tinyurl'].map((platform) => (
              <Badge key={platform} variant="secondary" className="text-xs">
                {platform}
              </Badge>
            ))}
            <Badge variant="secondary" className="text-xs">+more</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processingStatus && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{processingStatus.currentStep}</span>
              </div>
              <Progress value={processingStatus.progress} className="w-full" />
              <div className="text-xs text-muted-foreground">
                Step {processingStatus.step} of {processingStatus.totalSteps}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {processedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedProducts.map((product, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  {product.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{product.productCard?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {product.productCard?.platform} • ₹{product.productCard?.price}
                            </p>
                          </div>
                          {product.productCard?.imageUrl && (
                            <img 
                              src={product.productCard.imageUrl} 
                              alt={product.productCard.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            Added to {targetPage}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(product.productCard?.affiliateUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Product
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-600">Processing Failed</h4>
                        <p className="text-sm text-muted-foreground">{product.originalUrl}</p>
                        <p className="text-sm text-red-600 mt-1">{product.error}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default URLProcessor;