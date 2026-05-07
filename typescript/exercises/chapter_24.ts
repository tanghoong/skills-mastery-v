// ============================================================
// Chapter 24 — React Native + Expo
// Setup: npx create-expo-app@latest ch24 --template blank-typescript
// All exercises are implemented inside the Expo project.
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Typed RN component — ContactCard
// Build a ContactCard component that accepts:
//   name: string
//   phone: string
//   email?: string
//   avatarUri?: string
//   onCall: () => void
//   onMessage: () => void
//
// Use View, Text, Image, Pressable, StyleSheet.
// The onCall button should be green, onMessage should be blue.
// ----------------------------------------------------------------

// TODO: create src/components/ContactCard.tsx


// ----------------------------------------------------------------
// Exercise 2: FlatList with typed data
// Build a ContactsList screen that:
//   - Defines: interface Contact { id: string; name: string; phone: string; favourite: boolean }
//   - Has a hard-coded array of 8 contacts
//   - Renders them in a FlatList with typed renderItem and keyExtractor
//   - Shows a star icon (⭐) next to favourite contacts
//   - Shows "No contacts found" if the list is empty (use ListEmptyComponent)
// ----------------------------------------------------------------

// TODO: create src/screens/ContactsList.tsx


// ----------------------------------------------------------------
// Exercise 3: Typed navigation
// Set up React Navigation with these typed screens:
//   RootStackParamList:
//     Home:          undefined
//     ContactDetail: { contactId: string }
//     AddContact:    { prefillPhone?: string }
//
// Build:
//   HomeScreen    — shows ContactsList, each row navigates to ContactDetail
//   ContactDetail — reads contactId from route.params, finds and shows the contact
//   AddContact    — a form to add a new contact (at minimum: name + phone fields)
// ----------------------------------------------------------------

// TODO: create src/navigation/types.ts and all three screens


// ----------------------------------------------------------------
// Exercise 4: Typed TextInput form
// Build an AddContactForm component with:
//   - name (required, min 2 chars)
//   - phone (required, digits only)
//   - email (optional, must contain @)
//
// Type all TextInput onChange handlers properly using NativeSyntheticEvent.
// Show inline validation errors below each field.
// Show a success message (and clear the form) on valid submission.
// ----------------------------------------------------------------

// TODO: create src/components/AddContactForm.tsx


// ----------------------------------------------------------------
// Exercise 5: AsyncStorage persistence
// Extend ContactsList to persist contacts:
//   - On mount: load contacts from AsyncStorage (key: "contacts")
//   - On add: save updated array back to AsyncStorage
//   - On delete: save updated array back to AsyncStorage
//
// Write a typed custom hook:
//   usePersistedContacts(): {
//     contacts: Contact[];
//     addContact: (c: Omit<Contact, "id">) => Promise<void>;
//     removeContact: (id: string) => Promise<void>;
//     isLoading: boolean;
//   }
// ----------------------------------------------------------------

// TODO: create src/hooks/usePersistedContacts.ts
