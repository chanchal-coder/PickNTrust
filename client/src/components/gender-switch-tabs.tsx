import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GenderSwitchTabsProps {
  currentGender: string;
  onGenderChange: (gender: string) => void;
  categoryName: string;
}

export function GenderSwitchTabs({ currentGender, onGenderChange, categoryName }: GenderSwitchTabsProps) {
  // Check if this is a baby category OR if current gender is 'kids'
  const isBabyCategory = categoryName.toLowerCase().includes('baby') || categoryName.toLowerCase().includes('kids');
  const isKidsSelected = currentGender === 'kids' || currentGender === 'boys' || currentGender === 'girls';
  
  // If it's a baby category OR kids is selected, show boy/girl options
  if (isBabyCategory || isKidsSelected) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 py-6 px-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 mb-8">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
            <i className="fas fa-filter mr-2 text-blue-500"></i>
            Choose Category
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Filter {categoryName} products by gender
          </p>
        </div>
        <div className="flex justify-center">
          <Tabs 
            value={currentGender === 'kids' ? 'boys' : currentGender} 
            onValueChange={onGenderChange} 
            className="w-full max-w-md"
          >
            <TabsList className="grid w-full grid-cols-3 h-14 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md">
              <TabsTrigger 
                value="boys" 
                className="text-base font-semibold transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <i className="fas fa-male mr-2 text-lg"></i>
                {isBabyCategory ? 'Baby Boy' : 'Boy'}
              </TabsTrigger>
              <TabsTrigger 
                value="girls"
                className="text-base font-semibold transition-all duration-200 data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-pink-100 dark:hover:bg-pink-900/30"
              >
                <i className="fas fa-female mr-2 text-lg"></i>
                {isBabyCategory ? 'Baby Girl' : 'Girl'}
              </TabsTrigger>
              <TabsTrigger 
                value="common"
                className="text-base font-semibold transition-all duration-200 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-100 dark:hover:bg-purple-900/30"
              >
                <i className="fas fa-globe mr-2 text-lg"></i>
                Common
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-info-circle mr-1"></i>
            Switch between categories to see different products
          </p>
        </div>
      </div>
    );
  }

  // Default: show men/women/kids options
  return (
    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 py-6 px-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 mb-8">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          <i className="fas fa-filter mr-2 text-purple-500"></i>
          Choose Category
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Filter {categoryName} products by gender
        </p>
      </div>
      <div className="flex justify-center">
        <Tabs value={currentGender} onValueChange={onGenderChange} className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-md">
            <TabsTrigger 
              value="men" 
              className="text-base font-semibold transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <i className="fas fa-male mr-2 text-lg"></i>
              Men
            </TabsTrigger>
            <TabsTrigger 
              value="women"
              className="text-base font-semibold transition-all duration-200 data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-pink-100 dark:hover:bg-pink-900/30"
            >
              <i className="fas fa-female mr-2 text-lg"></i>
              Women
            </TabsTrigger>
            <TabsTrigger 
              value="kids"
              className="text-base font-semibold transition-all duration-200 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-green-100 dark:hover:bg-green-900/30"
            >
              <i className="fas fa-child mr-2 text-lg"></i>
              Kids
            </TabsTrigger>
            <TabsTrigger 
              value="common"
              className="text-base font-semibold transition-all duration-200 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-100 dark:hover:bg-purple-900/30"
            >
              <i className="fas fa-globe mr-2 text-lg"></i>
              Common
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="text-center mt-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <i className="fas fa-info-circle mr-1"></i>
          Switch between categories to see different products
        </p>
      </div>
    </div>
  );
}
