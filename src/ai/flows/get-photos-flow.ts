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
  uploadedAt: z.date(),
});

export type Photo = z.infer<typeof PhotoSchema>;

const GetPhotosOutputSchema = z.array(PhotoSchema);

const getPhotosFlow = ai.defineFlow(
  {
    name: 'getPhotosFlow',
    inputSchema: z.void(),
    outputSchema: GetPhotosOutputSchema,
  },
  async () => {
    const photos = getAllPhotos();
    return photos;
  }
);

export async function getPhotos(): Promise<StoredPhoto[]> {
  const result = await getPhotosFlow();
  return result;
}
