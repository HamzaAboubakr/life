# Odyssey → native SwiftUI: rewrite plan

Goal: real Liquid Glass, rendered by iOS, on an iPhone-only personal task app.
Not for the App Store. Installed directly from Xcode.

## Guiding principle

**Build from standard components wherever a standard component exists.**

Liquid Glass arrives automatically on system components when the app is compiled
against the iOS 26 SDK or later — it is opt-out (`UIDesignRequiresCompatibility`),
not opt-in. Custom views get nothing unless you call `.glassEffect()`, and per
Apple's HIG they mostly *shouldn't*: glass belongs to the navigation layer, never
the content layer.

So every hand-built control we can replace with a system one is a triple win:
less code, correct material for free, and it keeps working when iOS 28 changes
the design language.

Corollary: the task card, category chips and list rows stay **solid**, not glass.
That is both Apple's rule and what Structured and Todoist do.

## Target

| | |
|---|---|
| Min deployment | **iOS 26.0** (required for Liquid Glass) |
| UI | SwiftUI |
| Persistence | SwiftData (local only, no CloudKit on a free account) |
| Signing | Personal Team (free) to start; paid $99/yr later if kept |
| Distribution | None. Build-and-run from Xcode |

⚠️ **Unverified:** the iOS version on the owner's iPhone. Must be 26.0+ or none of
this renders. Confirm before Stage 1.

## Data model

Ports almost directly from `src/core/types.ts`. The web `Task` shape is already
clean — ISO dates, structured time, real tag IDs — so this is mechanical.

```swift
@Model final class Task {
    var id: UUID
    var title: String
    var category: String          // CategoryCard.name (user-definable, not an enum)
    var priority: Priority        // low | medium | high
    var notes: String?
    var date: Date                // scheduled day
    var startMinutes: Int?        // nil = all-day
    var endMinutes: Int?          // non-nil = range
    var recurrence: Recurrence?   // Codable enum; nil = one-off
    var tagIDs: [UUID]
    var linkedIDs: [UUID]         // ordered chain, max 10
    var createdAt: Date
}

@Model final class Completion {
    var taskID: UUID
    var date: Date                // the occurrence completed, not "now"
    var completedAt: Date
}

@Model final class CategoryCard {
    var name: String
    var rgb: String               // "92,164,235"
    var imageName: String         // asset catalog name
    var chipStyleID: String?
}

@Model final class Tag {
    var id: UUID
    var name: String
    var hex: String
}
```

Completion stays **per-occurrence** (task + date), which is what makes recurring
tasks track each day independently. Do not flatten this.

### What gets deleted outright

`core/ranks.ts`, `xp.ts`, `economy.ts`, `streak.ts`, `achievements.ts` and the
`balance` / `spentTotal` / `progression` / `owned` / `purchases` fields on `State`
— ~380 lines of dead gamification left over from the abandoned "Life" app.
Odyssey dropped all of it; the rewrite does not carry it forward.

`core/recurrence.ts` and the date helpers **do** port, near 1:1.

## Screen mapping

| Odyssey today | SwiftUI | Glass from SDK? |
|---|---|---|
| Bottom nav (hand-drawn, `backdrop-filter`, manual safe areas) | `TabView` | ✅ free |
| `#topblur` scroll blur | Automatic toolbar scroll edge effect | ✅ free |
| Tasks list | `ScrollView` + `LazyVStack` of custom cards | content layer — solid |
| Category filter chips | Custom horizontal chip row | content layer — solid |
| Task card (tinted bg + fading art) | Custom `View`: `Image` + `LinearGradient` | content layer — solid |
| Search overlay + `visualViewport` keyboard juggling | `.searchable()` | ✅ free |
| Calendar day strip | Custom horizontal scroll | content layer |
| Month picker sheet | `DatePicker(.graphical)` | ✅ free |
| Create/edit sheet | `.sheet` + `NavigationStack` + `Form` | ✅ free |
| **Wheel time picker** (hand-built scroll-snap columns) | `DatePicker(.wheel, .hourAndMinute)` | ✅ free |
| Date pill sub-sheet | `DatePicker(.graphical)` | ✅ free |
| Priority row | `Picker(.segmented)` or `Menu` | ✅ free |
| Recurring toggle + chips | `Toggle` + `Picker` | ✅ free |
| Linked tasks + HTML5 drag-reorder | `List` + `.onMove` / `.onDelete` | ✅ free |
| Card / tag / link pickers | `.sheet` + `List` or `Menu` | ✅ free |
| Category builder (12 designs, 12 chip styles) | Custom form in a sheet | mixed |
| Notes | `TextField(axis: .vertical)` | ✅ free |
| `wireSheetDrag()` drag-to-dismiss | Built into `.sheet` — **delete** | ✅ free |
| `style.css`, `main.ts` shell, layer system | No analogue — **delete** | — |

### The add button

The design puts a `+` FAB in the centre of the bottom nav. `TabView` has no centre
slot. Options:

1. `+` in the navigation toolbar (standard iOS, what Reminders does) — **recommended**
2. `.tabViewBottomAccessory` (iOS 26) — a glass accessory bar above the tab bar
3. A custom overlay FAB with `.glassEffect()` — closest to the current design,
   least standard

**Needs an owner decision.** Recommend 1; it is the most native and the most
future-proof.

## Migration of existing data

The owner's real tasks are in `localStorage` on the **phone**, inside the installed
PWA. That data is per-origin and per-device — it is not on the Mac.

**Stage 0 must happen while the web app is still the live one.**

1. Add an Export button to the web app that serializes state to JSON and offers it
   via the iOS share sheet (`navigator.share` with a `File`, download fallback).
2. Owner AirDrops the JSON to the Mac.
3. Native app imports it on first launch and maps it onto the SwiftData models.
4. Web app stays deployed and untouched as a fallback.

Do not skip step 4. Until the native app is proven, the web app is the daily driver.

## Stages

| # | Deliverable | Notes |
|---|---|---|
| 0 | JSON export in the web app; owner exports real data | Do this first, while web is live |
| 1 | Xcode project, SwiftData models, importer, assets ported | Category art PNGs → asset catalog |
| 2 | Tasks screen + Calendar screen + `TabView` | First look at real Liquid Glass |
| 3 | Create/edit sheet + every picker | Biggest deletions land here |
| 4 | Category builder, tags, search, recurrence, Done filter | Feature parity reached |
| 5 | Simulator verification pass, then owner installs to device | Then decide free vs paid |

Realistically 4–6 focused sessions. Stage 3 is the largest and the most likely to
overrun.

## Verification

Stages 1–4 verify in the **iOS Simulator** — build, launch, tap through, screenshot,
compare against the current app. That is self-serve and does not need the owner.

Stage 5 needs the owner: the Simulator cannot drive a physical iPhone. Getting it
onto the actual phone is Xcode → Run, by hand, and thereafter every 7 days on a
free Personal Team.

## Open questions

1. **iPhone iOS version** — must be 26.0+. Blocking.
2. **Add button placement** — toolbar vs bottom accessory vs custom FAB.
3. **How literally to follow the old design.** The handoff was HTML/CSS and was
   transcribed verbatim; SwiftUI cannot honour that, and adopting Liquid Glass
   already breaks it. Proposal: keep layout, spacing, colours and the category art;
   let controls and materials become Apple's. Confirm.
4. **Category art assets** — 12 design PNGs plus 5 defaults need to come across at
   @2x/@3x. Sizes are currently whatever the web used.

## Risks

- **Design drift.** The reason the React Native attempt was abandoned was fidelity
  loss. SwiftUI is far better suited than RN, but this is still a re-expression,
  not a transcription. Expect it to look *different* — the bet is that it looks
  more native, not more like the mock.
- **Free-tier expiry** silently kills the app every 7 days. If it becomes the daily
  driver, budget for $99/yr.
- **Stage 3 scope.** `sheet.ts` is 620 lines and holds six pickers plus the category
  builder. Most of it dissolves into system components, but the category builder
  does not and will need real custom work.
