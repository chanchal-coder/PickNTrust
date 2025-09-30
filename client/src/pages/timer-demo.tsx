import { TimerStylesDemo } from "../components/timer-styles";
import UniversalPageLayout from '@/components/UniversalPageLayout';

export default function TimerDemoPage() {
  return (
    <UniversalPageLayout pageId="timer-demo">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <TimerStylesDemo />
          </div>
    </UniversalPageLayout>
  );
}