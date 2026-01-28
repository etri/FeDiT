/**
 * @file useCaptureThumbnail.ts
 * @description Hook for capturing thumbnail screenshot from the drei viewer
 */

import { useThree } from '@react-three/fiber';

export function useCaptureThumbnail() {
  const { gl, scene, camera } = useThree();

  /**
   * Capture current view as thumbnail (Base64 encoded image)
   * @param quality Image quality (0.0 to 1.0, default: 0.8)
   * @param format Image format ('image/png' or 'image/jpeg', default: 'image/png')
   * @returns Base64 encoded image string (without data URL prefix) or null if failed
   */
  const captureThumbnail = async (
    quality: number = 0.8,
    format: 'image/png' | 'image/jpeg' = 'image/png'
  ): Promise<string | null> => {
    try {
      // Ensure the renderer has rendered the current frame
      gl.render(scene, camera);

      // Get canvas element
      const canvas = gl.domElement;

      if (!canvas) {
        console.error('[useCaptureThumbnail] Canvas element not found');
        return null;
      }

      // Convert canvas to data URL
      let dataUrl: string;
      if (format === 'image/jpeg') {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      } else {
        dataUrl = canvas.toDataURL('image/png');
      }

      // Extract base64 data (remove "data:image/png;base64," or "data:image/jpeg;base64," prefix)
      const base64Data = dataUrl.split(',')[1];

      if (!base64Data) {
        console.error('[useCaptureThumbnail] Failed to extract base64 data');
        return null;
      }

      console.log(`[useCaptureThumbnail] Thumbnail captured: ${format}, size: ${base64Data.length} bytes`);
      return base64Data;
    } catch (error) {
      console.error('[useCaptureThumbnail] Failed to capture thumbnail:', error);
      return null;
    }
  };

  return { captureThumbnail };
}

