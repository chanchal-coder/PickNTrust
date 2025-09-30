import { DatabaseStorage } from './server/storage.ts';

async function createTestAnnouncement() {
  try {
    console.log('Creating test announcement...');
    
    const storage = new DatabaseStorage();
    
    // Create test announcement data
    const announcementData = {
      message: 'Celebration Welcome to PickTrustDeals! Get 20% off on all electronics today only! Celebration',
      isActive: true,
      textColor: '#ffffff',
      backgroundColor: '#3b82f6',
      fontSize: '16px',
      fontWeight: 'bold',
      textDecoration: 'none',
      fontStyle: 'normal',
      animationSpeed: '30',
      textBorderWidth: '0px',
      textBorderStyle: 'solid',
      textBorderColor: '#000000',
      bannerBorderWidth: '0px',
      bannerBorderStyle: 'solid',
      bannerBorderColor: '#000000',
      createdAt: new Date()
    };
    
    // First deactivate all existing announcements
    console.log('Deactivating existing announcements...');
    const allAnnouncements = await storage.getAnnouncements();
    for (const announcement of allAnnouncements) {
      await storage.updateAnnouncement(announcement.id, { isActive: false });
    }
    
    // Create new active announcement
    const newAnnouncement = await storage.createAnnouncement(announcementData);
    console.log('Test announcement created successfully:', newAnnouncement);
    
  } catch (error) {
    console.error('Error creating test announcement:', error);
  }
}

createTestAnnouncement();
