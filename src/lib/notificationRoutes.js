// src/lib/notificationRoutes.js

export const getNotificationRoute = (userData) => {
  console.log("userData:",userData);
  if (!userData) return '/notifications';

  let role = userData.current_role?.toLowerCase();
  const sector = userData.sector?.toLowerCase();
    if (role === 'rc') {
    role = 'recruiter';
  }
  // Special Roles
  const specialRoutes = {
    admin: '/admin/notifications',
    hod: '/hod/notifications',
    operations: '/operations/notifications',
    jobpost: '/jobpost/notifications',
  };

  if (specialRoutes[role]) {
    return specialRoutes[role];
  }

  // Sector Based Roles
  const sectorRoles = [
    'manager',
    'fse',
    'leadgen',
    'recruiter',
    'tl',
    'crm',
    'revenue',
  ];
  console.log("sector,role", sector,role);
  if (sector && sectorRoles.includes(role)) {
    return `/${sector}/${role}/notifications`;
  }

  return '/notifications';
};

export const getCurrentNotificationRoute = () => {
  try {
    const userData = JSON.parse(localStorage.getItem('user'));

    return getNotificationRoute(userData);
  } catch (error) {
    console.error('Failed to get notification route:', error);
    return '/notifications';
  }
};