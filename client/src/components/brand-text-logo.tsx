import BrandLogo from "./brand-logo";

export default function BrandTextLogo({ className = "flex items-center gap-3" }: { className?: string }) {
  return (
    <div className={className}>
      <BrandLogo className="w-10 h-10" />
      <div className="flex flex-col">
        <span className="font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
          PickNTrust
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight opacity-90">
          Your Trusted Shopping Companion
        </span>
      </div>
    </div>
  );
}