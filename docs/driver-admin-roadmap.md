# Driver App and Admin Dashboard Roadmap

Owner: Mahela Yapa  
Priority: Driver app first. Admin dashboard second, and only when explicitly requested.  
Driver branch: `feature/driver-app`  
Admin branch: `feature/admin-dashboard`  
Existing combined branch: `feature/mahela-driver-admin` stays as history. Do not add new work to it.  
Apps: `apps/driver-mobile`, `apps/admin-web`  
Window: 15 Oct 2026 to 31 Dec 2026. Review path aimed at 18 Dec 2026.  
Jira: [SWMSBP-5](https://ravindunadeesha.atlassian.net/browse/SWMSBP-5) Driver & Collection App, [SWMSBP-6](https://ravindunadeesha.atlassian.net/browse/SWMSBP-6) Admin Web Dashboard.

Each task below is marked **Driver** or **Admin**. Do the next open Driver task. Leave Admin tasks until Driver work is blocked or you ask for an Admin task. Check a box only after the Verify steps pass and the "Done when" line is true.

Shared setup tasks are Jira children of the Driver epic and are linked to the Admin epic. User-facing work is a Jira Story. Setup and polish work is a Jira Task. Jira subtasks cannot sit directly on an epic.

## How to work

1. Driver work goes on `feature/driver-app`. Admin work goes on `feature/admin-dashboard`. Never commit both apps on the same new branch.
2. Build only the next unchecked Driver task, unless an Admin task was requested.
3. Call the real backend for auth, users, areas, announcements, and community updates. Leave Prisma, the citizen app, the AI services, and the ESP32 to the rest of the team.
4. On this machine `pnpm` is not on PATH. Run package scripts with `corepack pnpm --filter <package> <script>`.
5. Run that task's Verify steps. Keep the command output or a screenshot until the box is checked.

## Build order after the backend merge

The `ishara` branch is merged into `feature/mahela-driver-admin`. The backend now has PostgreSQL, Prisma, and these endpoints:

| Endpoint | Use it for |
|---|---|
| `POST /api/v1/auth/login` | Driver and admin sign-in. Reject the wrong role in the app. |
| `GET /api/v1/users/me` | The signed-in profile. |
| `GET /api/v1/areas` | Area names for admin lists and driver context. |
| `/api/v1/announcements` | Admin writes notices. The driver app reads published notices. |
| `/api/v1/community-updates` | Admin review of citizen community posts. |

There is still no tractor, route, GPS, bin, weight, or engine data in the database. Those screens stay typed and behind the fixture flag. Build them only after that data exists, so the remaining work is connecting the screens to the new endpoints.

### Driver, do these next

1. Task 8. English, Sinhala, and Tamil. **Driver**
2. Driver inbox for published announcements from `GET /api/v1/announcements`. **Driver**
3. Driver profile from `GET /api/v1/users/me`. **Driver**

### Admin, only when asked

1. Task 17. Admin layout. **Admin**
2. Task 18. Admin login. **Admin**
3. Admin areas list from `GET /api/v1/areas`. **Admin**
4. Task 22. Admin creates and publishes announcements. **Admin**
5. Admin user list. **Admin**
6. Admin view of community updates. **Admin**

### Wait for GPS and bin data

Tasks 10–16, 19, 20, 23–28, and 30. That is the trip map, engine time, speed, fuel, collected weight, time wastage, the fleet map, the geofence editor, the trip reports, the wastage charts, deviation alerts, playback, and the offline GPS queue. The contracts and fixtures for those shapes already exist, so this later work is a small connection step.

## Already done

- [x] Admin shell. Vite, React, TypeScript, package name `admin-web`, port `5173`. Screen shows **EcoCollect Admin** and `API base: http://localhost:4000/api/v1`. Verify: `corepack pnpm --filter admin-web dev`, then open http://localhost:5173 and confirm those two lines.
- [x] Jira issues SWMSBP-48 through SWMSBP-80 exist and are assigned to mahelayapa5. Verify: open the [SWMSBP backlog](https://ravindunadeesha.atlassian.net/jira/software/projects/SWMSBP/boards/2/backlog) and confirm both epics list those children.
- [ ] [SWMSBP-40](https://ravindunadeesha.atlassian.net/browse/SWMSBP-40) Driver Figma. In progress. Required before task 7. Verify: the file contains the login, route, trip, weight, and settings screens before task 7 starts.
- [ ] [SWMSBP-41](https://ravindunadeesha.atlassian.net/browse/SWMSBP-41) Admin Figma. In progress. Required before task 17. Verify: the file contains login, fleet map, route edit, complaints, broadcasts, reports, and charts before task 17 starts.

## Locked choices

| Choice | Selection |
|---|---|
| Server data | TanStack Query |
| UI state | Zustand for session, language, and the active trip |
| Forms | React Hook Form + Zod |
| Admin UI | shadcn/ui |
| Charts | Recharts |
| Admin map | Leaflet + OpenStreetMap |
| Driver map | react-native-maps |
| Driver languages | i18next: English, Sinhala, Tamil |
| Driver token | expo-secure-store |
| Admin token | memory only |
| Fuel figure | distance / 8 km per liter, labeled as an estimate |
| Driver SDK | Expo SDK 57, same major as `apps/citizen-mobile` |

## Outside this file

Citizen app, Prisma, PostgreSQL schema, PostGIS, route-optimization AI, waste prediction, ESP32, MQTT, and the SMS gateway. The 30-minute approaching alert is a citizen notification. These apps only display or submit the API shapes those systems own.

## Review checkpoints

- **19 Nov:** driver can sign in, switch language, follow a route, and log GPS, engine time, distance, speed, fuel, weight, and idle time.
- **10 Dec:** admin can sign in, see the fleet, edit a route corridor, read complaints, send a broadcast, and open reports and wastage charts.
- **18 Dec:** deviation alert, admin alert feed, and the route plus date-range comparison are in. Playback (task 28) and the polythene template (task 29) can slip.

---

## Phase 1. Foundation (15–22 Oct)

### 1. Driver app shell

- [x] [SWMSBP-48](https://ravindunadeesha.atlassian.net/browse/SWMSBP-48)
- Epic: SWMSBP-5. Difficulty: Easy. Depends on: admin shell.

Add `apps/driver-mobile` with Expo SDK 57 and TypeScript. The first screen shows **EcoCollect Driver** and the API base URL from `app.json` `extra.apiBaseUrl` (`http://localhost:4000/api/v1`).

Why: GPS, language, and trip screens need a running app first.

Done when: `corepack pnpm --filter driver-mobile web` shows that screen, and the package name is `driver-mobile`.

Verify:

1. From the repo root, run `corepack pnpm --filter driver-mobile web`.
2. Open http://localhost:8081.
3. Confirm the page shows **EcoCollect Driver**, **Driver shell is running.**, and `API base: http://localhost:4000/api/v1`.
4. Confirm `apps/driver-mobile/package.json` has `"name": "driver-mobile"` and `"expo": "~57.0.28"`.

### 2. Feature folders in both apps

- [x] [SWMSBP-49](https://ravindunadeesha.atlassian.net/browse/SWMSBP-49)
- Epics: SWMSBP-5, linked to SWMSBP-6. Difficulty: Easy. Depends on: task 1.

Add `src/features`, `src/services`, and `src/config` in both apps. Move the existing env helper into `src/config`. Do not add business screens.

Why: later screens need one place to live.

Done when: both apps still start, and new code has a folder that is not the Vite or Expo starter root.

Verify:

1. Confirm `src/features`, `src/services`, and `src/config` exist in both `apps/admin-web` and `apps/driver-mobile`.
2. Confirm the env helper for each app lives under that app's `src/config`.
3. Run `corepack pnpm --filter admin-web dev` and open http://localhost:5173. The admin shell still renders.
4. Run `corepack pnpm --filter driver-mobile web` and open http://localhost:8081. The driver shell still renders.

### 3. Typed API contracts and fixtures

- [x] [SWMSBP-50](https://ravindunadeesha.atlassian.net/browse/SWMSBP-50)
- Epics: SWMSBP-5, linked to SWMSBP-6. Difficulty: Medium. Depends on: task 2.

Add TypeScript types and JSON fixtures for auth, tractors, routes, trips, GPS points, engine events, weight entries, activity logs, complaints, broadcasts, and alerts. Five tractors, five routes, weekdays only.

Why: the backend is still a health check. Both apps must keep building.

Done when: a fixture loader returns typed data, and the shapes cover every later screen.

Verify:

1. Run the fixture test for both apps.
2. Confirm the test reports 5 tractors and 5 routes.
3. Confirm a weekday-only schedule is present and a weekend collection is absent.
4. Remove one required field from a fixture and confirm the TypeScript check fails. Restore the field before checking this box.

### 4. HTTP client

- [x] [SWMSBP-51](https://ravindunadeesha.atlassian.net/browse/SWMSBP-51)
- Epics: SWMSBP-5, linked to SWMSBP-6. Difficulty: Medium. Depends on: task 3.

One typed client per app. Timeout, one retry on network failure, and errors with a code and a message. A flag selects fixtures instead of the network. Do not log tokens or request bodies that contain passwords.

Why: collection days lose signal. Call sites must not each invent retry behavior.

Done when: a forced failure surfaces a typed error, and a fixture read does not call the network.

Verify:

1. Run the client test with fixtures enabled. Confirm the test's fetch spy is called zero times.
2. Run the failure test. Confirm the client tries once, retries once, then throws an error that has both `code` and `message`.
3. Search the test log output for the fixture password. It must not appear.

### 5. Error boundaries

- [x] [SWMSBP-52](https://ravindunadeesha.atlassian.net/browse/SWMSBP-52)
- Epics: SWMSBP-5, linked to SWMSBP-6. Difficulty: Easy. Depends on: task 1.

A visible fallback in each app when a screen throws, with a way to try again.

Why: a map or chart failure must not blank the shift or the dispatch desk.

Done when: a thrown test error shows the fallback instead of a blank page.

Verify:

1. In the driver app, throw once from a test screen or a temporary button.
2. Confirm the fallback is visible and **Try again** renders the screen after the throw is removed.
3. Repeat on the admin app at http://localhost:5173.
4. Remove the temporary throw before checking this box.

### 6. Session storage

- [x] [SWMSBP-53](https://ravindunadeesha.atlassian.net/browse/SWMSBP-53)
- Epics: SWMSBP-5, linked to SWMSBP-6. Difficulty: Medium. Depends on: task 4.

Driver access token in `expo-secure-store`. Admin access token in memory only. Language and other UI preferences may use local storage.

Why: a JWT in `localStorage` is readable by any script on the dashboard, and a tractor phone can be lost.

Done when: the admin token is gone after a full page reload, and the driver token is not in AsyncStorage or a plain JSON file.

Verify:

1. Sign in on the admin app. In the browser Application panel, confirm the access token is not in `localStorage` or `sessionStorage`.
2. Reload http://localhost:5173. Confirm the session is gone.
3. Run the driver storage test. Confirm the token writer does not call AsyncStorage and does not write a JSON file.

---

## Phase 2. Driver (23 Oct–19 Nov)

Figma [SWMSBP-40](https://ravindunadeesha.atlassian.net/browse/SWMSBP-40) is required before task 7. Match the screens that exist there. Where a screen is missing, use large type, high contrast, and tap targets at least 48 px.

### 7. Driver can sign in

- [x] [SWMSBP-54](https://ravindunadeesha.atlassian.net/browse/SWMSBP-54)
- Epic: SWMSBP-5. Difficulty: Medium. Depends on: tasks 6 and SWMSBP-40.

Email and password with React Hook Form and Zod. Accept only role `DRIVER`. Store the token with task 6. A wrong role or bad password shows a clear message.

Why: collection actions must belong to the signed-in driver.

Done when: the fixture driver reaches the home screen, and an admin fixture is rejected.

Verify:

1. Open the driver app. Sign in with the fixture driver email and password.
2. Confirm the home screen opens.
3. Sign out. Sign in with the fixture admin email and password.
4. Confirm the error names the role and the home screen does not open.
5. Submit an empty form. Confirm both fields show a validation message and no request is sent.

### 8. English, Sinhala, and Tamil

- [x] [SWMSBP-55](https://ravindunadeesha.atlassian.net/browse/SWMSBP-55)
- Epic: SWMSBP-5. Difficulty: Medium. Depends on: task 7.

i18next. The choice is saved and available on the login screen and in settings. Every later driver string goes through the translation files.

Why: drivers need Sinhala and Tamil in the field. Adding this before the other screens avoids rewriting labels.

Done when: switching language updates the login screen and the choice is still selected after a restart.

Verify:

1. On the login screen, switch to Sinhala. Confirm the visible labels change and are not still English.
2. Reload the app. Confirm Sinhala is still selected.
3. Switch to Tamil, reload, and confirm Tamil remains selected.
4. Switch back to English and confirm the labels return to English.

### 9. Today's route card

- [ ] [SWMSBP-56](https://ravindunadeesha.atlassian.net/browse/SWMSBP-56)
- Epic: SWMSBP-5. Difficulty: Medium. Depends on: task 8.

Show the assigned tractor, route name, planned window, and stop count from fixtures. Include an empty state for a day with no assignment.

Why: five tractors run five routes a day, five days a week. The driver needs one job before the shift starts.

Done when: the signed-in fixture driver sees one route, and a driver with no route sees the empty state.

Verify:

1. Sign in as the assigned fixture driver.
2. Confirm tractor, route name, planned window, and stop count match the fixture.
3. Sign in as the fixture driver who has no assignment.
4. Confirm the empty state is shown and no route fields are left blank.

### 10. GPS capture and offline queue

- [ ] [SWMSBP-57](https://ravindunadeesha.atlassian.net/browse/SWMSBP-57)
- Epic: SWMSBP-5. Difficulty: Hard. Depends on: task 9.

Request location permission. Sample on a battery-aware interval while a trip is active. Store points locally and sync when the network returns. Denied permission has its own message.

Why: location, distance, and deviation alerts depend on a point log that survives signal loss.

Done when: points recorded with the network off appear in the local queue and send after the network returns.

Verify:

1. Start a trip with the browser or device set offline.
2. Confirm the local queue count increases by the number of new points.
3. Set the network back online. Confirm those points leave the queue.
4. Block location permission, open the trip screen, and confirm the denied-permission message is shown.

### 11. Trip map

- [ ] [SWMSBP-58](https://ravindunadeesha.atlassian.net/browse/SWMSBP-58)
- Epic: SWMSBP-5. Difficulty: Hard. Depends on: task 10.

Show the current fix and the planned route with react-native-maps. Large controls. No text entry on this screen.

Why: the driver must see the route while moving. react-native-maps fits Expo on mid-range Android.

Done when: the map shows the latest point and the planned line, and the screen has no text fields.

Verify:

1. Open the trip screen with a fixture location and route.
2. Confirm a marker sits on the latest point and a line follows the planned route.
3. Confirm the screen contains no text input. The only controls are buttons.

### 12. Engine on and off log

- [ ] [SWMSBP-59](https://ravindunadeesha.atlassian.net/browse/SWMSBP-59)
- Epic: SWMSBP-5. Difficulty: Medium. Depends on: task 10.

Record engine on and off with timestamps. Show total engine-on duration for the shift. Use a driver control until IoT events exist. Ignore a second "on" while the engine is already on.

Why: the client asked for engine-on time. The ESP32 work belongs to another teammate.

Done when: on, off, on produces two intervals and the duration is their sum.

Verify:

1. Tap engine on, wait, tap off, tap on, wait, tap off.
2. Confirm the log shows two intervals and the total equals their sum.
3. Tap on twice in a row. Confirm a second open interval is not created.

### 13. Distance, speed, and overspeed

- [ ] [SWMSBP-60](https://ravindunadeesha.atlassian.net/browse/SWMSBP-60)
- Epic: SWMSBP-5. Difficulty: Medium. Depends on: task 10.

Compute distance from GPS points. Show current speed. Flag samples over a configured limit. The limit comes from config, not a hardcoded screen constant.

Why: route mileage, speed, and overspeed detection are client requirements. Fuel math uses the same distance.

Done when: a fixture track yields a stable distance, and one over-limit sample is flagged.

Verify:

1. Load the fixture track. Confirm the distance on screen matches the expected distance written next to that fixture.
2. Confirm the sample above the configured limit is marked overspeed, and the sample below it is not.
3. Change only the limit in config and rerun the check. Confirm which sample is flagged changes with the config value.

### 14. Fuel estimate

- [ ] [SWMSBP-61](https://ravindunadeesha.atlassian.net/browse/SWMSBP-61)
- Epic: SWMSBP-5. Difficulty: Easy. Depends on: task 13.

Show liters as distance divided by 8. Label it as an estimate.

Why: the client specified about 8 km per liter. It must not look like a tank reading.

Done when: 16 km displays 2.0 L and the word estimate is visible.

Verify:

1. Open a shift whose distance is 16 km.
2. Confirm the screen shows `2.0 L` and the word **estimate**.
3. Confirm the screen does not say the tank was measured.

### 15. Collected weight entry

- [ ] [SWMSBP-62](https://ravindunadeesha.atlassian.net/browse/SWMSBP-62)
- Epic: SWMSBP-5. Difficulty: Medium. Depends on: task 9.

After the route is marked complete, enter weight in kilograms. Zod rejects empty, negative, and non-numeric values. Keep a draft if the submit fails. Show the household collection limit as information. Do not block the entry with that limit.

Why: staff record garbage weight manually at the end of the route.

Done when: a valid weight submits, an invalid weight does not, and a failed submit is still on screen after leaving and returning.

Verify:

1. Mark the route complete. Submit `12.5`. Confirm success.
2. Submit an empty value, `-1`, and `abc`. Confirm each stays on the form with a validation message.
3. Submit a weight above the household limit. Confirm the limit is visible and the submit is still accepted.
4. Force the submit to fail. Leave the screen and come back. Confirm the draft weight is still there.

### 16. Time-wastage activity log

- [ ] [SWMSBP-63](https://ravindunadeesha.atlassian.net/browse/SWMSBP-63)
- Epic: SWMSBP-5. Difficulty: Hard. Depends on: tasks 12 and 13.

Classify moving, short stop, and idle time from GPS and engine state. Write a structured local log and sync it. Idle means engine on and not moving past a small speed threshold for a configured duration.

Why: time wastage has to be measured, not only distance.

Done when: a fixture shift produces moving, stop, and idle segments whose durations add up to the shift.

Verify:

1. Run the activity-log test with the fixture shift.
2. Confirm the result contains moving, short stop, and idle segments.
3. Add the segment durations and confirm the total equals the shift length.
4. Confirm the idle segment is the period where the engine is on and speed stays under the threshold.

---

## Phase 3. Admin (20 Nov–10 Dec)

Figma [SWMSBP-41](https://ravindunadeesha.atlassian.net/browse/SWMSBP-41) is required before task 17.

### 17. Admin layout and route guards

- [ ] [SWMSBP-64](https://ravindunadeesha.atlassian.net/browse/SWMSBP-64)
- Epic: SWMSBP-6. Difficulty: Medium. Depends on: task 6 and SWMSBP-41.

React Router, a desktop and tablet layout, and a guard that only an ADMIN session can pass. Deep links to a private page redirect to login.

Why: every later page needs the same navigation and the same role check.

Done when: a logged-out visit to a private route ends on the login page, and an admin session sees the layout.

Verify:

1. While logged out, open a private admin URL such as the fleet map route.
2. Confirm the browser ends on the login page.
3. Sign in as the fixture admin. Confirm the navigation layout is visible.
4. Repeat step 3 at a desktop width and at a 768 px tablet width.

### 18. Admin can sign in

- [ ] [SWMSBP-65](https://ravindunadeesha.atlassian.net/browse/SWMSBP-65)
- Epic: SWMSBP-6. Difficulty: Medium. Depends on: task 17.

Email and password with React Hook Form and Zod. Reject every role other than `ADMIN`. Token stays in memory.

Why: route edits, broadcasts, and complaints are municipal operations.

Done when: the fixture admin enters the layout, and a driver fixture is rejected.

Verify:

1. Sign in with the fixture admin. Confirm the layout opens.
2. Sign out. Sign in with the fixture driver. Confirm the role error is shown and the layout does not open.
3. Sign in as admin again, then reload the page. Confirm the session is gone.

### 19. Live fleet map

- [ ] [SWMSBP-66](https://ravindunadeesha.atlassian.net/browse/SWMSBP-66)
- Epic: SWMSBP-6. Difficulty: Hard. Depends on: tasks 3 and 18.

Leaflet with OpenStreetMap. Plot each tractor's latest point and its planned route. Selecting a tractor shows its route name and last update time.

Why: admin must see all tractors and routes.

Done when: five fixture tractors appear on the map with their route lines.

Verify:

1. Open the fleet map.
2. Count 5 tractor markers and 5 route lines.
3. Select one tractor. Confirm its route name and last update time match the fixture.

### 20. Route edit and geofence preview

- [ ] [SWMSBP-67](https://ravindunadeesha.atlassian.net/browse/SWMSBP-67)
- Epic: SWMSBP-6. Difficulty: Hard. Depends on: task 19.

Edit the route line. Redraw the corridor around it before save. Submit the new geometry to the mock API. Cancel restores the previous line.

Why: the client requires manual route edits and an automatic geofence update. Optimization math stays with the AI teammate.

Done when: moving a point moves the corridor, save keeps the new line, and cancel does not.

Verify:

1. Drag one route vertex. Confirm the corridor moves with it.
2. Save and reload the page. Confirm the new line is still there.
3. Drag the vertex again and choose cancel. Confirm the line returns to the saved shape.

### 21. Complaints inbox

- [ ] [SWMSBP-68](https://ravindunadeesha.atlassian.net/browse/SWMSBP-68)
- Epic: SWMSBP-6. Difficulty: Easy. Depends on: task 18.

List citizen complaints with status and area filters. Allow a status change against the mock API. Do not build the citizen submission form.

Why: complaints are submitted in the citizen app. Admin staff need to see and track them.

Done when: the filter hides non-matching rows, and a status change survives a reload of the fixture list.

Verify:

1. Open the complaints list. Filter by one area. Confirm rows from other areas are hidden.
2. Change one complaint's status.
3. Reload the list. Confirm the new status is still shown.

### 22. Broadcast composer

- [ ] [SWMSBP-69](https://ravindunadeesha.atlassian.net/browse/SWMSBP-69)
- Epic: SWMSBP-6, linked to SWMSBP-5. Difficulty: Medium. Depends on: tasks 9 and 18.

Write a message, pick drivers or all tractors, and store it. The driver app shows the same items in an inbox. The payload may include `smsFallback`. Do not call an SMS gateway.

Why: admin must broadcast operational messages.

Done when: a message sent from the dashboard appears in the signed-in driver's inbox.

Verify:

1. On the admin dashboard, send a message to one fixture driver.
2. Sign in to the driver app as that driver. Confirm the message is in the inbox.
3. In the browser network panel, confirm the send did not call an SMS provider.

### 23. Operations report tables

- [ ] [SWMSBP-70](https://ravindunadeesha.atlassian.net/browse/SWMSBP-70)
- Epic: SWMSBP-6. Difficulty: Medium. Depends on: tasks 14, 15, and 18.

Filterable tables for fuel, route mileage, distance, speed, engine-on time, and collected weight. Filters are date range and route.

Why: the client asked for monthly, fuel, mileage, and the combined distance, speed, engine, fuel, and collection reports.

Done when: each table shows fixture rows, and a route filter removes the other routes.

Verify:

1. Open the fuel, mileage, distance, speed, engine-on, and weight tables. Confirm each has fixture rows.
2. Filter by one route. Confirm rows for the other routes disappear.
3. Set a date range that excludes one known row. Confirm that row disappears.

### 24. Wastage charts

- [ ] [SWMSBP-71](https://ravindunadeesha.atlassian.net/browse/SWMSBP-71)
- Epic: SWMSBP-6. Difficulty: Medium. Depends on: tasks 16 and 23.

Recharts for time wastage, fuel wastage, weight anomalies, and route efficiency. Each chart has a title, a unit, and an empty state.

Why: wastage must be readable, not only listed in a table.

Done when: all four charts render from fixtures, and an empty fixture shows the empty state instead of a broken axis.

Verify:

1. Open the charts page. Confirm time wastage, fuel wastage, weight anomalies, and route efficiency each have a title and a unit.
2. Switch to the empty fixture.
3. Confirm each chart shows its empty state and no broken or unlabeled axis.

---

## Phase 4. Advanced (11–18 Dec)

Tasks 28 and 29 can slip without losing the 18 Dec review.

### 25. Driver route-deviation alert

- [ ] [SWMSBP-72](https://ravindunadeesha.atlassian.net/browse/SWMSBP-72)
- Epic: SWMSBP-5. Difficulty: Hard. Depends on: tasks 11 and 20.

When the latest point leaves the route corridor, show a short alert and log the event. Keep the control large and the copy short. Do not require the driver to type.

Why: the client wants a geo-fence per route and an alert when the tractor leaves it.

Done when: a fixture point outside the corridor raises one alert, and a point back inside does not raise another.

Verify:

1. Start a trip and feed a fixture point outside the corridor.
2. Confirm one short alert appears, and its dismiss control is at least 48 px.
3. Feed a later point inside the corridor. Confirm a second alert does not appear.

### 26. Admin alert feed

- [ ] [SWMSBP-73](https://ravindunadeesha.atlassian.net/browse/SWMSBP-73)
- Epic: SWMSBP-6. Difficulty: Medium. Depends on: tasks 13 and 25.

Show deviation, overspeed, and breakdown alerts with tractor, route, and time.

Why: dispatch needs the same events the driver sees.

Done when: the three fixture alert types are listed with tractor and time.

Verify:

1. Open the admin alert feed.
2. Confirm one deviation row, one overspeed row, and one breakdown row.
3. Confirm each row shows a tractor and a time.

### 27. Planned versus actual comparison

- [ ] [SWMSBP-74](https://ravindunadeesha.atlassian.net/browse/SWMSBP-74)
- Epic: SWMSBP-6. Difficulty: Hard. Depends on: tasks 16, 23, and 24.

Pick a route and a date range. Compare planned time with actual time, and expected weight with collected weight. Show the difference as wastage, including a negative difference when actual is under plan.

Why: this is the route-level time and weight wastage view.

Done when: one route and a range that contains two trips shows both time and weight differences.

Verify:

1. Select the fixture route and the date range that contains its two trips.
2. Confirm planned time, actual time, and the time difference are visible.
3. Confirm expected weight, collected weight, and the weight difference are visible.
4. Include a trip under plan and confirm that difference is negative.

### 28. Historical trip playback

- [ ] [SWMSBP-75](https://ravindunadeesha.atlassian.net/browse/SWMSBP-75)
- Epic: SWMSBP-6. Difficulty: Medium. Depends on: task 19. Review: can slip.

Replay a finished trip's points on the admin map.

Why: the client asked for historical movement. Task 27 covers the review if this slips.

Done when: play moves a marker along the saved points in order.

Verify:

1. Open a finished fixture trip.
2. Press play.
3. Confirm the marker visits the saved points in order and stops on the last point.

### 29. Polythene-day broadcast template

- [ ] [SWMSBP-76](https://ravindunadeesha.atlassian.net/browse/SWMSBP-76)
- Epic: SWMSBP-6. Difficulty: Easy. Depends on: task 22. Review: can slip.

Admin selects a prepared polythene-collection message and sends it through the broadcast flow from task 22.

Why: polythene-day notices are a client requirement. The citizen app and SMS gateway still deliver them to households.

Done when: choosing the template fills the composer, and sending it creates a normal broadcast.

Verify:

1. Choose the polythene-day template. Confirm the composer text matches the template.
2. Send it.
3. Confirm the sent list contains that text as a normal broadcast.

---

## Phase 5. Polish (19–31 Dec)

### 30. Driver offline queue screen

- [ ] [SWMSBP-77](https://ravindunadeesha.atlassian.net/browse/SWMSBP-77)
- Epic: SWMSBP-5. Difficulty: Medium. Depends on: tasks 10, 15, and 16.

The driver can see unsynced GPS points, weight drafts, and activity logs, and retry them.

Why: a failed sync during a collection day must be visible.

Done when: queued items are listed with a count, and retry removes the items that succeed.

Verify:

1. Create queued GPS points, a weight draft, and an activity log while offline.
2. Open the queue screen. Confirm the count matches those items.
3. Go online and press retry. Confirm the items that succeed leave the list and the count drops.

### 31. Driver safety and contrast pass

- [ ] [SWMSBP-78](https://ravindunadeesha.atlassian.net/browse/SWMSBP-78)
- Epic: SWMSBP-5. Difficulty: Medium. Depends on: task 11.

Enlarge tap targets, remove typing from the moving-trip screen, and check outdoor contrast on a mid-range Android width.

Why: the driver is operating a tractor.

Done when: the trip screen has no text input, primary controls are at least 48 px, and text on the trip screen meets a contrast check.

Verify:

1. Open the trip screen. Confirm there is no text input.
2. Measure a primary control. Confirm it is at least 48 px in both width and height.
3. Check the trip-screen text against its background in the browser accessibility pane. Confirm the contrast passes.

### 32. Empty, error, and slow states

- [ ] [SWMSBP-79](https://ravindunadeesha.atlassian.net/browse/SWMSBP-79)
- Epic: SWMSBP-6. Difficulty: Easy. Depends on: tasks 19, 21, and 23.

Explicit states for no route, no complaints, map load failure, and a slow API on the admin screens that need them.

Why: a demo and a real shift both hit empty days and bad networks.

Done when: each of those four situations shows its own message, not a blank panel or a raw error.

Verify:

1. Load the no-route fixture. Confirm a no-route message, not a blank panel.
2. Load the no-complaints fixture. Confirm a no-complaints message.
3. Block map tiles. Confirm a map-failure message, not a raw stack trace.
4. Delay the fixture response. Confirm a slow or loading message until the data arrives.

### 33. Demo script and app notes

- [ ] [SWMSBP-80](https://ravindunadeesha.atlassian.net/browse/SWMSBP-80)
- Epic: SWMSBP-6, linked to SWMSBP-5. Difficulty: Easy. Depends on: task 27.

Write a short run-through of one driver shift and one admin review, plus the commands that start each app.

Why: the December review needs a path that does not depend on unfinished backend work.

Done when: another person can start both apps from the notes and complete the script on fixtures.

Verify:

1. Open a new terminal and follow only the written start commands.
2. Confirm the admin app opens at http://localhost:5173 and the driver app opens at http://localhost:8081.
3. Follow the written shift and review script using fixtures only. Confirm it finishes without starting the backend.

---

## Start commands

Admin dashboard, from the repo root:

```powershell
corepack pnpm --filter admin-web dev
```

Open http://localhost:5173.

Driver app, after task 1 exists:

```powershell
corepack pnpm --filter driver-mobile web
```

`corepack pnpm admin:dev` and `corepack pnpm driver:dev` fail on this machine because those root scripts call `pnpm` directly and `pnpm` is not on PATH.
