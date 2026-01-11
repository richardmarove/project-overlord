/**
 * Format activity action for display
 * @param {object} activity - The activity object
 * @returns {string} - Formatted action string
 */
export const formatActivityAction = (activity) => {
  const actionMap = {
    user_login: 'Logged in',
    user_logout: 'Logged out',
    post_created: `Created post`,
    post_updated: `Updated post`,
    post_deleted: `Deleted post`,
    settings_updated: 'Updated settings',
    file_uploaded: 'Uploaded file',
  };
  return actionMap[activity.action] || activity.action;
};

/**
 * Format time ago
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted time ago string
 */
export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};
