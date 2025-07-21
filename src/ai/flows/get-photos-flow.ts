'use server';
/**
 * @fileOverview A flow to retrieve all saved photos.
 *
 * - getPhotos - A function that returns all saved photos.
 * - Photo - The type definition for a photo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAllPhotos, Photo as StoredPhoto } from '@/ai/photo-store';

const PhotoSchema = z.object({
  name: z.string(),
  dataUri: z.string(),
  uploadedAt: z.string().datetime(),
});

export type Photo = StoredPhoto;

const GetPhotosOutputSchema = z.array(PhotoSchema);

const getPhotosFlow = ai.defineFlow(
  {
    name: 'getPhotosFlow',
    inputSchema: z.void(),
    outputSchema: GetPhotosOutputSchema,
  },
  async () => {
    const photos = getAllPhotos();
    // The date is converted to an ISO string for serialization and schema validation.
    return photos.map(p => ({...p, uploadedAt: p.uploadedAt.toISOString()}));
  }
);

export async function getPhotos(): Promise<Photo[]> {
  // We call the flow, but return the original data from the store
  // so the UI gets the Date object it expects.
  // The flow is still useful for validation and potential future logic.
  await getPhotosFlow();
  return getAllPhotos();
}
