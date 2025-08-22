import { DatabaseStorage } from './server/storage.ts';

async function checkActiveAnnouncement() {
  try {
    console.log('Checking active announcement...');
    
    const storage = new DatabaseStorage();
    
    // Get all announcements
    const allAnnouncements = await storage.getAnnouncements();
    console.log('All announcements:', allAnnouncements);
    
    // Get active announcements
    const activeAnnouncements = allAnnouncements.filter(announcement => announcement.isActive);
    console.log('Active announcements:', activeAnnouncements);
    
    if (activeAnnouncements.length > 0) {
      console.log('Active announcement found:', activeAnnouncements[0]);
    } else {
      console.log('No active announcement found');
    }
  } catch (error) {
    console.error('Error checking active announcement:', error);
  }
}

checkActiveAnnouncement();
