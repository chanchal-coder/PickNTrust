import type { FC } from 'react';

interface ShareAutomaticallyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  platforms: string[];
}

const ShareAutomaticallyModal: FC<ShareAutomaticallyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  platforms
}) => {
  if (!isOpen) return null;

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'fab fa-instagram';
      case 'facebook':
        return 'fab fa-facebook';
      case 'whatsapp':
        return 'fab fa-whatsapp';
      case 'telegram':
        return 'fab fa-telegram';
      case 'twitter':
        return 'fab fa-twitter';
      case 'linkedin':
        return 'fab fa-linkedin';
      default:
        return 'fas fa-share';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'facebook':
        return 'bg-blue-600 text-white';
      case 'whatsapp':
        return 'bg-green-500 text-white';
      case 'telegram':
        return 'bg-blue-500 text-white';
      case 'twitter':
        return 'bg-gray-800 text-white';
      case 'linkedin':
        return 'bg-blue-700 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 text-white">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mb-4">
            <i className="fas fa-share-alt text-blue-400 text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold mb-2">Share Product Automatically?</h2>
          <p className="text-gray-300 text-sm">
            Share "{productName}" to your configured platforms:
          </p>
        </div>

        {/* Platform Icons */}
        <div className="flex justify-center gap-3 mb-6">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium ${getPlatformColor(platform)}`}
            >
              <i className={getPlatformIcon(platform)}></i>
              <span>{platform}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-edit"></i>
            Share Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareAutomaticallyModal;