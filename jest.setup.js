/* eslint-env jest */
const mockAsyncStorage = require('@react-native-async-storage/async-storage/jest/async-storage-mock');

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('@react-native-community/datetimepicker', () => {
  const MockDateTimePicker = () => null;
  return MockDateTimePicker;
});

jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Circle: View,
  };
});

jest.mock('@react-native-community/push-notification-ios', () => {
  return {
    __esModule: true,
    default: {
      addNotificationRequest: jest.fn(),
      removePendingNotificationRequests: jest.fn(),
      setApplicationIconBadgeNumber: jest.fn(),
      requestPermissions: jest.fn(() =>
        Promise.resolve({ alert: true, sound: true, badge: true }),
      ),
      checkPermissions: jest.fn(callback =>
        callback({ alert: true, sound: true, badge: true }),
      ),
    },
  };
});

jest.mock('react-native-calendar-events', () => {
  return {
    __esModule: true,
    default: {
      checkPermissions: jest.fn(() => Promise.resolve('authorized')),
      requestPermissions: jest.fn(() => Promise.resolve('authorized')),
      fetchAllEvents: jest.fn(() => Promise.resolve([])),
    },
  };
});
