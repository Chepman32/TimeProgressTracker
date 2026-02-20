# Software Design Document (SDD)

## 1. Document Control
- Product: TimeProgressTracker (Pretty Progress style app clone)
- Platform: iOS-first React Native application
- Repository: `/Users/antonchepur/Documents/TimeProgressTracker`
- Status: Implemented

## 2. System Overview
TimeProgressTracker is a countdown/count-up product focused on visual progress tracking, recurring windows, theme-driven UI, and reminder workflows.

Core goals:
- Track one-time and recurring time windows.
- Provide premium visual templates and advanced personalization.
- Deliver smooth spring-based interactions and transitions.
- Support import/export backup and calendar-assisted setup.

## 3. Scope
### In Scope
- iOS application flows: onboarding, dashboard, library, timeline, settings.
- Countdown editor/detail modals.
- Recurrence windows (daily/weekly/monthly/yearly).
- Local persistence and migration.
- Local notification scheduling.
- Calendar event import.
- PRO gating UX (demo unlock flow).

### Out of Scope
- Android parity (explicitly excluded for this phase).
- Real billing/StoreKit subscription backend.
- Cloud sync, widgets, watch app.

## 4. Technology Stack
- React Native + TypeScript
- React Native core Animated API for spring/velocity interactions
- AsyncStorage for local state persistence
- `@react-native-community/datetimepicker` for date/time input
- `@react-native-community/push-notification-ios` for local notifications
- `react-native-calendar-events` for calendar import
- CocoaPods for iOS native dependency management

## 5. Architecture
The app follows a layered modular design:

1. Presentation layer
- Screens: `/src/screens/*`
- Components: `/src/components/*`
- Root composition/navigation state: `/src/AppRoot.tsx`

2. Domain layer
- Types/contracts: `/src/domain/types.ts`
- Factory/default state/preset creation: `/src/domain/factories.ts`
- Themes/presets/palette: `/src/domain/themes.ts`, `/src/domain/presets.ts`, `/src/domain/palette.ts`

3. State layer
- Store/reducer/actions/hooks: `/src/hooks/useCountdownStore.ts`

4. Infrastructure layer
- Persistence/migration/import parsing: `/src/lib/storage.ts`
- Date and recurrence logic: `/src/lib/date.ts`
- Notifications: `/src/lib/notifications.ts`
- Calendar integration: `/src/lib/calendar.ts`

## 6. Feature Design
### 6.1 Onboarding
- First-run onboarding screen is shown until completion flag is set.
- Completion persists in app state.

### 6.2 Dashboard
- Displays sorted countdown cards.
- Sorting priority: pinned -> active before archived -> nearest target.
- Card interactions include open/edit/pin/archive pathways.

### 6.3 Editor Modal
- Create and edit countdowns.
- Fields: title, icon, notes, mode, start/target dates, recurrence, theme, visual style, notification toggles.
- Calendar import can prefill title/notes/start/target.
- PRO themes are locked unless PRO is unlocked.

### 6.4 Detail Modal
- Expanded view with progress metrics and operations (edit, pin, archive, delete).

### 6.5 Library
- Preset templates for common use cases.
- Presets tied to theme and recurrence defaults.
- PRO preset/theme lock respected.

### 6.6 Timeline
- Chronological view of countdown windows.

### 6.7 Settings
- Appearance mode (system/light/dark)
- Behavior flags (week start, haptics, archived default)
- Notifications permissions + test trigger
- Backup/restore modal access
- PRO status and unlock entry point

### 6.8 PRO Experience
- Modal with plan presentation and unlock action.
- Unlock currently toggles local `proUnlocked` flag (demo flow).

### 6.9 Backup & Restore
- Export full app state JSON.
- Import validates structure before accepting.
- Migration path normalizes imported state to active schema.

### 6.10 Notifications
- Requests iOS permissions.
- Schedules reminder requests per countdown notification settings.
- Supports week-before/day-before/end/milestone events.
- Re-sync occurs after state changes when notifications are enabled.

### 6.11 Calendar Import
- Requests calendar permissions.
- Loads upcoming events window.
- User selects event to map into editor draft data.

## 7. Data Design
Primary persisted object (`AppState`):
- `schemaVersion`
- `onboardingCompleted`
- `proUnlocked`
- `settings`
- `countdowns[]`

Countdown entity includes:
- identity/meta (`id`, `title`, `icon`, `notes`)
- temporal fields (`startDate`, `targetDate`, `recurrence`, `mode`)
- presentation (`themeId`, `progressVisual`)
- flags (`pinned`, `archived`)
- notification config object

Storage key:
- `@time-progress-tracker/state-v1`

Migration behavior:
- Invalid or incompatible shape falls back to initial state.
- Partial fields merged against current default schema.

## 8. Navigation & UI State
- Root tab state managed in `AppRoot` with tabs: dashboard, library, timeline, settings.
- Modal states: editor, detail, backup, PRO, calendar import.
- User flow is modal-heavy for editing/detail actions to preserve context.

## 9. Animation Design
- Spring + velocity-based animation patterns used in:
  - countdown cards (entrance + press)
  - bottom tab indicator
  - segmented control indicator
  - detail modal entrance
  - background motion
- Animations prioritize responsive feel and iOS-like motion consistency.

## 10. iOS Integration Requirements
`Info.plist` includes:
- Calendar permissions:
  - `NSCalendarsUsageDescription`
  - `NSCalendarsFullAccessUsageDescription`
  - `NSCalendarsWriteOnlyAccessUsageDescription`
- Notification description:
  - `NSUserNotificationUsageDescription`

## 11. Quality & Validation
Validation performed:
- `yarn lint`
- `yarn tsc --noEmit`
- `yarn test --watch=false`
- iOS simulator build via `xcodebuild`

Result:
- App builds and tests pass.
- Existing native warnings originate from third-party dependencies, not app business logic.

## 12. Known Constraints / Risks
- Notification library uses deprecated iOS APIs internally (dependency-level warnings).
- PRO billing is currently demo/local toggle only.
- No backend or cloud synchronization.

## 13. Production Readiness Checklist (Current)
- Implemented architecture with typed domain/state boundaries: Yes
- State migration and import validation: Yes
- iOS permissions and native integrations wired: Yes
- Build/test/lint gates passing: Yes
- Real subscription billing integration: No (planned)
- CI/CD + crash analytics + observability: Pending

## 14. Recommended Next Phase
1. Replace demo PRO unlock with StoreKit products + receipt validation.
2. Replace deprecated notification dependency with modern UNUserNotificationCenter-native implementation.
3. Add E2E test coverage for critical flows (create/edit/import/restore/notifications).
4. Add release pipeline automation and runtime analytics/crash monitoring.
