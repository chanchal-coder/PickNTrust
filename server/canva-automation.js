// Minimal Canva automation stub to satisfy imports and enable testing
export const canvaAutomation = {
  async triggerContentCreation(contentItem) {
    // Simulate successful automation trigger
    console.log('[CanvaAutomation] Triggered for:', {
      id: contentItem?.id,
      type: contentItem?.type,
      title: contentItem?.title
    });
    return { success: true };
  }
};

export default { canvaAutomation };