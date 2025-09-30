import LogoDesign1 from "@/components/logo-design-1";
import LogoDesign2 from "@/components/logo-design-2";
import LogoDesign3 from "@/components/logo-design-3";
import LogoDesign4 from "@/components/logo-design-4";
import UniversalPageLayout from '@/components/UniversalPageLayout';

export default function LogoPreview() {
  return (
    <UniversalPageLayout pageId="logo-preview">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
                Choose Your Logo Design
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Design 1: Large Checkmark Inside Cart */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
                    Design 1: Large Checkmark Inside Cart
                  </h2>
                  <LogoDesign1 />
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
                    Features: Prominent checkmark inside cart, trust shield, sparkles, animated elements
                  </p>
                </div>
      
                {/* Design 2: Side-by-side with Floating Checkmark */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
                    Design 2: Floating Checkmark
                  </h2>
                  <LogoDesign2 />
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
                    Features: Circular cart, floating checkmark, spinning ring, shield emoji
                  </p>
                </div>
      
                {/* Design 3: Minimal with Integrated Checkmark */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
                    Design 3: Minimal & Clean
                  </h2>
                  <LogoDesign3 />
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
                    Features: Clean design, checkmark in handle, subtle colors, professional look
                  </p>
                </div>
      
                {/* Design 4: Playful with Multiple Elements */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-center mb-6 text-gray-700 dark:text-gray-300">
                    Design 4: Playful & Colorful
                  </h2>
                  <LogoDesign4 />
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
                    Features: Rainbow gradient, multiple checkmarks, hearts, stars, very animated
                  </p>
                </div>
              </div>
      
              <div className="text-center mt-8">
                <p className="text-gray-600 dark:text-gray-400">
                  Each design includes the same text layout:<br/>
                  <strong>Pick N Trust</strong> - Shop Smart, Shop Trusted<br/>
                  Pick. Click. Trust. Shop Smart.<br/>
                  Your trusted shopping companion
                </p>
              </div>
            </div>
          </div>
    </UniversalPageLayout>
  );
}