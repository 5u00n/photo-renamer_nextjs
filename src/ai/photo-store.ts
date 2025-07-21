/**
 * @fileOverview A simple in-memory store for photos.
 * NOTE: This is for demonstration purposes only. In a real application,
 * you would use a persistent database like Firestore or Cloud Storage.
 * Data will be lost on server restart.
 */

export interface Photo {
  name: string;
  dataUri: string;
  uploadedAt: Date;
}

// In-memory array to store photos
const photos: Photo[] = [];

/**
 * Adds a new photo to the store.
 * @param photo The photo object to add.
 */
export function addPhoto(photo: Photo): void {
  photos.unshift(photo); // Add to the beginning of the array
}

/**
 * Retrieves all photos from the store, sorted by most recent.
 * @returns An array of all photo objects.
 */
export function getAllPhotos(): Photo[] {
  return [...photos];
}
