import * as Contacts from 'expo-contacts';

/**
 * Check existing permission status for reading device address book
 */
export async function getContactsPermissionStatus() {
  const { status } = await Contacts.getPermissionsAsync();
  return status;
}

/**
 * Request contacts permission from the OS
 */
export async function requestContactsPermission() {
  const { status } = await Contacts.requestPermissionsAsync();
  return status;
}

/**
 * Fetch contacts list from local phone book.
 * Returns local contacts or mock contacts if empty/error.
 */
export async function getLocalContacts() {
  try {
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
    });

    if (data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.log('Error fetching device contacts, falling back to mock data:', e);
  }

  // Mock data fallback when device contacts are empty or unavailable (e.g. Simulator)
  return [
    { name: 'Ronaldo King', phoneNumbers: [{ number: '08555444333' }] },
    { name: 'Messi Barcelona', phoneNumbers: [{ number: '08999888777' }] },
    { name: 'Toko Roti Enak', phoneNumbers: [{ number: '08123456789' }] },
    { name: 'Penipu Hadiah Palsu', phoneNumbers: [{ number: '08987654321' }] },
  ];
}
