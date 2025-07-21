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
  // We call the flow and return its result, converting the ISO string
  // back to a Date object for the UI.
  const result = await getPhotosFlow();
  return result.map(p => ({...p, uploadedAt: new Date(p.uploadedAt)}));
}
