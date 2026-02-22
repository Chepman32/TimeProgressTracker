#import <React/RCTBridgeModule.h>
#import <UserNotifications/UserNotifications.h>

@interface LocalNotifier : NSObject <RCTBridgeModule>
@end

@implementation LocalNotifier

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(schedule:(NSDictionary *)request) {
  NSString *identifier = request[@"id"] ?: [[NSUUID UUID] UUIDString];
  NSString *title      = request[@"title"] ?: @"";
  NSString *body       = request[@"body"]  ?: @"";
  NSString *fireDateISO = request[@"fireDate"];
  NSString *threadId   = request[@"threadId"];

  UNMutableNotificationContent *content = [[UNMutableNotificationContent alloc] init];
  content.title  = title;
  content.body   = body;
  content.sound  = [UNNotificationSound defaultSound];

  if (threadId) {
    content.threadIdentifier = threadId;
  }

  if (@available(iOS 15.0, *)) {
    content.interruptionLevel = UNNotificationInterruptionLevelActive;
  }

  UNNotificationTrigger *trigger = nil;
  if (fireDateISO) {
    NSISO8601DateFormatter *formatter = [[NSISO8601DateFormatter alloc] init];
    NSDate *fireDate = [formatter dateFromString:fireDateISO];
    if (fireDate) {
      NSTimeInterval interval = [fireDate timeIntervalSinceNow];
      if (interval > 0) {
        trigger = [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:interval repeats:NO];
      } else {
        NSLog(@"[LocalNotifier] ⚠️  Fire date already in the past for %@, skipping", identifier);
        return;
      }
    }
  }

  UNNotificationRequest *notifRequest =
    [UNNotificationRequest requestWithIdentifier:identifier content:content trigger:trigger];

  [[UNUserNotificationCenter currentNotificationCenter]
    addNotificationRequest:notifRequest
    withCompletionHandler:^(NSError *_Nullable error) {
      if (error) {
        NSLog(@"[LocalNotifier] ❌ Failed to schedule %@: %@", identifier, error.localizedDescription);
      } else {
        NSLog(@"[LocalNotifier] ✅ Scheduled \"%@\" (%@) for %@",
              title, identifier, fireDateISO ?: @"immediately");
      }
    }];
}

RCT_EXPORT_METHOD(cancel:(NSArray<NSString *> *)identifiers) {
  [[UNUserNotificationCenter currentNotificationCenter]
    removePendingNotificationRequestsWithIdentifiers:identifiers];
}

@end
