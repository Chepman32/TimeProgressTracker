import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications
#if canImport(RNCPushNotificationIOS)
import RNCPushNotificationIOS
#endif

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "TimeProgressTracker",
      in: window,
      launchOptions: launchOptions
    )

    UNUserNotificationCenter.current().delegate = self

    return true
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    if #available(iOS 14.0, *) {
      completionHandler([.banner, .list, .sound, .badge])
      return
    }

    completionHandler([.alert, .sound, .badge])
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
#if canImport(RNCPushNotificationIOS)
    RNCPushNotificationIOS.didReceiveNotificationResponse(response)
#endif
    completionHandler()
  }

  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
#if canImport(RNCPushNotificationIOS)
    RNCPushNotificationIOS.didRegisterForRemoteNotifications(withDeviceToken: deviceToken)
#endif
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
#if canImport(RNCPushNotificationIOS)
    RNCPushNotificationIOS.didFailToRegisterForRemoteNotifications(withError: error)
#endif
  }

  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable : Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
#if canImport(RNCPushNotificationIOS)
    RNCPushNotificationIOS.didReceiveRemoteNotification(userInfo, fetchCompletionHandler: completionHandler)
#endif
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
