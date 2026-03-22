/**
 * Asset Configuration
 *
 * Centralized configuration for all media assets (videos, images).
 * Modify this file to change asset paths across the entire application.
 */

// Asset path configuration
export const ASSET_CONFIG = {
  // Base paths (modify these for different deployments)
  basePath: '/portfolio',  // Must match basePath in next.config.js

  // Video naming patterns
  videos: {
    idle: 'idle',
  },

  // Image paths
  images: {
    poster: 'poster',
  },

  // Suffixes
  suffixes: {
    real: '_real',      // Photorealistic version
  },

  // File extensions
  extensions: {
    video: '.mp4',
    image: '.jpg',
  },
};

/**
 * Build a video path based on conditions
 * @param {string} videoName - Base video name (e.g., 'idle')
 * @param {Object} options - Path building options
 * @param {boolean} options.isReal - Use photorealistic version
 * @returns {string} Complete video path
 */
export function getVideoPath(videoName, { isReal = false } = {}) {
  const { basePath, suffixes, extensions } = ASSET_CONFIG;
  const avatarSuffix = isReal ? suffixes.real : '';
  return `${basePath}/${videoName}${avatarSuffix}${extensions.video}`;
}

/**
 * Get poster image path
 * @param {boolean} isReal - Use photorealistic version
 * @returns {string} Poster image path
 */
export function getPosterPath(isReal = false) {
  const { basePath, suffixes, extensions } = ASSET_CONFIG;
  const avatarSuffix = isReal ? suffixes.real : '';
  return `${basePath}/${ASSET_CONFIG.images.poster}${avatarSuffix}${extensions.image}`;
}

// Export video names for easy access
export const VIDEO_NAMES = ASSET_CONFIG.videos;
