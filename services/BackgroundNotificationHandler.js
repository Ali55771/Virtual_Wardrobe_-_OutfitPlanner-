import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { getDatabase, ref, push, set } from 'firebase/database';
import { app } from '../config/firebaseConfig';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

// Initialize Firebase outside of the task definition
let database;
try {
  database = getDatabase(app);
} catch (e) {
  console.error("Failed to initialize Firebase in background task's global scope", e);
}

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
  console.log('📬 Received a notification in the background!');

  if (error) {
    console.error('❌ Background notification task error:', error);
    return;
  }

  if (!database) {
    console.error('❌ Firebase database is not initialized. Cannot save notification.');
    return;
  }

  if (data?.notification?.request?.content) {
    const { title, body, data: notificationPayload } = data.notification.request.content;

    console.log('💾 Saving background notification to database:', notificationPayload);
    try {
      const notificationsRef = ref(database, 'notifications');
      const newNotificationRef = push(notificationsRef);

      await set(newNotificationRef, {
        title: title || 'No Title',
        message: body || 'No message body.',
        data: notificationPayload || {},
        createdAt: new Date().toISOString(),
        isRead: false,
      });

      console.log('✅ Background notification saved successfully.');
    } catch (dbError) {
      console.error('❌ Error saving background notification to database:', dbError);
    }
  } else {
    console.log('No data payload found in the background notification.');
  }
});

export const registerBackgroundNotificationTask = async () => {
  try {
    console.log('Registering background notification task...');
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('✅ Background notification task registered successfully.');
    } else {
      console.log('Notification permissions are not granted. Skipping task registration.');
    }
  } catch (e) {
    console.error('❌ Failed to register background notification task:', e);
  }
};

export async function unregisterBackgroundNotificationTask() {
  try {
    await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('Background notification task unregistered');
  } catch (error) {
    console.error('Failed to unregister background notification task:', error);
  }
}