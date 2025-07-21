'use server';
/**
 * @fileOverview A flow to save a photo with a new name.
 *
 * - savePhoto - A function that handles saving the photo.
 * - SavePhotoInput - The input type for the savePhoto function.
 * - SavePhotoOutput - The return type for the savePhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {addPhoto, Photo} from '@/ai/photo-store';

const SavePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  newName: z.string().describe('The new file name for the photo.'),
});
export type SavePhotoInput = z.infer<typeof SavePhotoInputSchema>;

const SavePhotoOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SavePhotoOutput = z.infer<typeof SavePhotoOutputSchema>;

const savePhotoFlow = ai.defineFlow(
  {
    name: 'savePhotoFlow',
    inputSchema: SavePhotoInputSchema,
    outputSchema: SavePhotoOutputSchema,
  },
  async (input) => {
    const photo: Photo = {
      name: input.newName,
      dataUri: input.photoDataUri,
      uploadedAt: new Date(),
    };
    addPhoto(photo);

    console.log(`Saved photo: ${input.newName}`);
    
    return {
      success: true,
      message: 'Photo saved successfully on the server.',
    };
  }
);

export async function savePhoto(input: SavePhotoInput): Promise<SavePhotoOutput> {
  return savePhotoFlow(input);
}
