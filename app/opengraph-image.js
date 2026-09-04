import { createSocialImage, socialImageSize } from './social-image.js';

export const alt = 'RLSProof — Supabase RLS and tenant isolation release evidence';
export const size = socialImageSize;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return createSocialImage();
}
