import { Clock, Zap, Timer, Hourglass, AlarmClock } from "lucide-react";

interface TimerStyleProps {
  timeLeft: string;
  isExpired: boolean;
  style: 'default' | 'neon' | 'gradient' | 'minimal' | 'badge' | 'outlined' | 'pulse';
  className?: string;
}

export function TimerStyleShowcase({ timeLeft, isExpired, style, className = "" }: TimerStyleProps) {
  const baseClasses = "inline-flex items-center gap-2 text-sm font-semibold tracking-wide";

  switch (style) {
    case 'default':
      return (
        <div className={`${baseClasses} px-4 py-2 rounded-full border-2 ${
          isExpired 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400' 
            : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300'
        } ${className}`}>
          <Clock className={`w-4 h-4 ${
            isExpired ? 'text-red-500' : 'text-orange-600 dark:text-orange-400 animate-pulse'
          }`} />
          <span>{isExpired ? "Deal Expired" : `Deal ends in ${timeLeft}`}</span>
        </div>
      );

    case 'neon':
      return (
        <div className={`${baseClasses} px-4 py-2 rounded-lg border-2 ${
          isExpired 
            ? 'bg-gray-900 border-red-500 text-red-400 shadow-lg shadow-red-500/25' 
            : 'bg-gray-900 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-400/25'
        } ${className}`}>
          <Zap className={`w-4 h-4 ${
            isExpired ? 'text-red-400' : 'text-cyan-300 animate-pulse'
          }`} />
          <span className="drop-shadow-lg">{isExpired ? "Deal Expired" : `Deal ends in ${timeLeft}`}</span>
        </div>
      );

    case 'gradient':
      return (
        <div className={`${baseClasses} px-4 py-2 rounded-xl border-2 ${
          isExpired 
            ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-400 text-white' 
            : 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 border-purple-300 text-white'
        } ${className}`}>
          <Timer className={`w-4 h-4 ${
            isExpired ? 'text-white' : 'text-white animate-pulse'
          }`} />
          <span className="font-bold">{isExpired ? "Deal Expired" : `Deal ends in ${timeLeft}`}</span>
        </div>
      );

    case 'minimal':
      return (
        <div className={`${baseClasses} px-3 py-1 rounded ${
          isExpired 
            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
            : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
        } ${className}`}>
          <Hourglass className={`w-3 h-3 ${
            isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400 animate-spin'
          }`} style={{animationDuration: '3s'}} />
          <span className="text-xs">{isExpired ? "Expired" : timeLeft}</span>
        </div>
      );

    case 'badge':
      return (
        <div className={`${baseClasses} px-2 py-1 rounded-full text-xs ${
          isExpired 
            ? 'bg-red-500 text-white' 
            : 'bg-orange-500 text-white animate-bounce'
        } ${className}`}>
          <AlarmClock className="w-3 h-3" />
          <span>{isExpired ? "Expired" : timeLeft}</span>
        </div>
      );

    case 'outlined':
      return (
        <div className={`${baseClasses} px-4 py-2 rounded-lg border-2 bg-transparent ${
          isExpired 
            ? 'border-red-500 text-red-500 dark:text-red-400' 
            : 'border-green-500 text-green-600 dark:text-green-400'
        } ${className}`}>
          <Clock className={`w-4 h-4 ${
            isExpired ? 'text-red-500' : 'text-green-500 animate-pulse'
          }`} />
          <span>{isExpired ? "Deal Expired" : `Deal ends in ${timeLeft}`}</span>
        </div>
      );

    case 'pulse':
      return (
        <div className={`${baseClasses} px-4 py-2 rounded-full ${
          isExpired 
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700' 
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 animate-pulse'
        } ${className}`}>
          <Timer className={`w-4 h-4 ${
            isExpired ? 'text-red-500' : 'text-blue-500'
          }`} />
          <span>{isExpired ? "Deal Expired" : `Deal ends in ${timeLeft}`}</span>
        </div>
      );

    default:
      return null;
  }
}

// Demo component to showcase all timer styles
export function TimerStylesDemo() {
  const styles: Array<{name: string, style: TimerStyleProps['style'], description: string}> = [
    { name: 'Default (Orange/Amber)', style: 'default', description: 'Your current design - orange/amber gradient with rounded corners' },
    { name: 'Neon Glow', style: 'neon', description: 'Dark background with neon cyan glow effect' },
    { name: 'Gradient Rainbow', style: 'gradient', description: 'Bold gradient from purple to red with white text' },
    { name: 'Minimalist', style: 'minimal', description: 'Clean and simple with spinning hourglass icon' },
    { name: 'Badge Style', style: 'badge', description: 'Compact badge with bouncing animation' },
    { name: 'Outlined', style: 'outlined', description: 'Transparent background with colored border' },
    { name: 'Pulse Effect', style: 'pulse', description: 'Soft blue with pulsing animation' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Timer Style Options</h2>
        <p className="text-gray-600 dark:text-gray-300">Choose from these beautiful timer designs</p>
      </div>
      
      <div className="grid gap-6">
        {styles.map((styleItem, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{styleItem.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{styleItem.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                <TimerStyleShowcase timeLeft="2h 35m 42s" isExpired={false} style={styleItem.style} />
                <TimerStyleShowcase timeLeft="" isExpired={true} style={styleItem.style} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <i className="fas fa-lightbulb"></i> <strong>Pro Tip:</strong> Each style works perfectly in both light and dark modes!
        </p>
      </div>
    </div>
  );
}