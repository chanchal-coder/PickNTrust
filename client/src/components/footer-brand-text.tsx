export default function FooterBrandText() {
  return (
    <div className="flex flex-col text-left">
      {/* Main Brand Name - Pick N Trust with Individual Gradients - Footer sized */}
      <div className="flex items-center gap-0.5 mb-0.5">
        <span className="text-base font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Pick
        </span>
        <span className="text-base font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          N
        </span>
        <span className="text-base font-black bg-gradient-to-r from-pink-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
          Trust
        </span>
      </div>
      
      {/* Shop Smart, Shop Trusted */}
      <div className="text-xs font-bold text-white dark:text-white mb-0.5">
        Shop Smart, Shop Trusted
      </div>
      
      {/* Action Phrase with Gradient */}
      <div className="text-xs font-medium bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent mb-0.5">
        Pick. Click. Trust. Shop Smart.
      </div>
      
      {/* Tagline */}
      <div className="text-xs text-yellow-400 dark:text-yellow-300 font-normal italic">
        "Your trusted shopping companion"
      </div>
    </div>
  );
}