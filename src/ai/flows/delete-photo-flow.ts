'use server';
/**
 * @fileOverview A flow to delete a photo.
 *
 * - deletePhoto - A function that handles deleting a photo.
 * - DeletePhotoInput - The input type for the deletePhoto function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { deletePhoto as deleteFromStore } from '@/ai/photo-store';

const DeletePhotoInputSchema = z.object({
  name: z.string().describe('The name of the photo to delete.'),
});
export type DeletePhotoInput = z.infer<typeof DeletePhotoInputSchema>;

const deletePhotoFlow = ai.defineFlow(
  {
    name: 'deletePhotoFlow',
    inputSchema: DeletePhotoInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    deleteFromStore(input.name);
    console.log(`Deleted photo: ${input.name}`);
  }
);

export async function deletePhoto(input: DeletePhotoInput): Promise<void> {
  return deletePhotoFlow(input);
}
