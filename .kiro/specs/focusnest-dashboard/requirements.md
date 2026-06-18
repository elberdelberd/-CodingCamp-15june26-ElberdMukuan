# Requirements Document

## Introduction

FocusNest is a To-Do List Life Dashboard web application built with HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend server — all data is persisted in the browser's Local Storage. The application provides a unified personal productivity dashboard with a real-time clock and greeting, a configurable Pomodoro-style focus timer, a full-featured task manager, quick-access bookmark links, a visual progress tracker, and light/dark theme support.

This document formally captures what FocusNest does and must do, so the existing implementation can be verified and refined against these requirements.

---

## Glossary

- **Dashboard**: The main single-page view of FocusNest that presents all widgets in one screen.
- **App**: The FocusNest web application as a whole.
- **Clock**: The component that displays the current local time and date.
- **Greeting**: The personalized welcome message shown at the top of the Dashboard.
- **Timer**: The Pomodoro-style countdown component used for focus sessions.
- **Session**: A single uninterrupted countdown run of the Timer from the configured duration to zero.
- **Task**: A single to-do item managed by the Task_Manager.
- **Task_Manager**: The component responsible for creating, editing, toggling, deleting, and listing Tasks.
- **Task_List**: The ordered collection of Tasks currently stored in Local Storage.
- **Quick_Links**: The component that displays and manages user-defined bookmark links.
- **Link**: A single bookmark entry with a name and URL, managed by Quick_Links.
- **Progress_Tracker**: The component that visualises completion statistics for the Task_List.
- **Toast**: A brief non-blocking notification message shown to the user.
- **Modal**: An overlay dialog used for data-entry actions (adding a link, editing a task, changing a name).
- **Theme**: The visual color scheme of the App, either `light` or `dark`.
- **Local_Storage**: The browser's `localStorage` API used as the sole persistence layer.
- **User_Name**: The custom display name entered by the user that appears in the Greeting and the top navigation chip.
- **Pomodoro_Duration**: The configurable length (in minutes) of a focus Session.

---

## Requirements

### Requirement 1: Real-Time Clock Display

**User Story:** As a user, I want to see the current time and date at a glance, so that I always know when I am without leaving the Dashboard.

#### Acceptance Criteria

1. WHEN the App initialises, THE Clock SHALL display the current local time in 12-hour format where the hour is a non-zero-padded integer from 1 to 12, and the minutes and seconds are zero-padded to 2 digits, followed by `AM` or `PM` (e.g., `9:05:03 AM`).
2. WHEN the App initialises, THE Clock SHALL display the current local date as a full string containing weekday name, month name, day, and year (e.g., `Tuesday, June 15, 2026`).
3. WHILE the App is open, THE Clock SHALL update both the time and the date display every 1 second to reflect the current local time (covering midnight rollover).
4. IF the system clock is unavailable at initialisation, THEN THE Clock SHALL display `--:--:-- --` for time and `--` for date, and SHALL retry every 1 second until a valid time is obtained.

---

### Requirement 2: Time-of-Day Greeting

**User Story:** As a user, I want to see a personalised greeting that adapts to the time of day, so that the Dashboard feels welcoming and contextually relevant.

#### Acceptance Criteria

1. WHEN the local hour is between 05:00 and 11:59, THE Greeting SHALL display the phrase `Good Morning`, the subtitle `Have a productive day!`, and the 🌻 emoji.
2. WHEN the local hour is between 12:00 and 16:59, THE Greeting SHALL display the phrase `Good Afternoon`, the subtitle `Keep up the great work!`, and the ☀️ emoji.
3. WHEN the local hour is between 17:00 and 20:59, THE Greeting SHALL display the phrase `Good Evening`, the subtitle `You did great today!`, and the 🌆 emoji.
4. WHEN the local hour is between 21:00 and 04:59, THE Greeting SHALL display the phrase `Good Night`, the subtitle `Time to rest and recharge.`, and the 🌙 emoji.
5. WHEN the App initialises, THE Greeting SHALL immediately display the correct phrase, subtitle, and emoji for the current local hour without waiting for the hour to change.
6. WHEN the local hour changes, THE Greeting SHALL update its phrase, emoji, and subtitle without requiring a page reload.
7. THE Greeting SHALL display the message in the format `[phrase], [User_Name]! [emoji]`, where `[User_Name]` defaults to `User` if no name has been saved.

---

### Requirement 3: Custom User Name

**User Story:** As a user, I want to set my own name in the Greeting, so that the Dashboard feels personally addressed to me.

#### Acceptance Criteria

1. WHEN the user clicks the Greeting name or the top navigation chip, THE App SHALL open the name-change Modal.
2. WHEN the user submits a non-empty, non-whitespace-only name of 1–30 characters via the Modal, THE App SHALL update the User_Name displayed in the Greeting and in the navigation chip within the same render cycle (no visible delay).
3. WHEN the user submits a valid name via the Modal, THE App SHALL persist the User_Name to Local_Storage and close the Modal.
4. IF the user submits an empty or whitespace-only name, THEN THE App SHALL display a Toast with an error message and keep the Modal open with the input field focused.
5. WHEN the App initialises, THE App SHALL restore the User_Name from Local_Storage, or default to `User` if no value is stored.

---

### Requirement 4: Focus Timer

**User Story:** As a user, I want a countdown focus timer, so that I can apply time-boxing techniques to improve my concentration.

#### Acceptance Criteria

1. WHEN the App initialises, THE Timer SHALL display the remaining time as the stored Pomodoro_Duration converted to seconds, formatted as `MM:SS` (e.g., 25 minutes → `25:00`).
2. WHEN the user presses the Start button and the Timer is idle (not running and remaining time > 0), THE Timer SHALL begin counting down in 1-second decrements.
3. WHEN the user presses the Start button and the Timer is at 0 seconds remaining, THE Timer SHALL reset to the full Pomodoro_Duration before beginning to count down.
4. WHEN the user presses the Stop button and the Timer is running, THE Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user presses the Reset button (whether the Timer is running or paused), THE Timer SHALL stop the countdown, restore remaining time to the full Pomodoro_Duration, and update the display accordingly.
6. WHEN the Timer countdown reaches zero, THE Timer SHALL stop automatically.
7. WHEN the Timer countdown reaches zero, THE App SHALL display a Toast notifying the user that the Session is complete.
8. THE Timer SHALL display the remaining time as `MM:SS` with both minutes and seconds zero-padded to 2 digits.
9. THE Timer SHALL render a circular SVG arc where the filled arc length equals `(remaining_seconds ÷ total_seconds) × full_circumference`; the arc is fully filled at the start of a Session and reaches zero length when the Timer reaches zero.

---

### Requirement 5: Configurable Pomodoro Duration

**User Story:** As a user, I want to set my own focus session length, so that I can adapt the timer to different types of work.

#### Acceptance Criteria

1. WHEN the user enters a whole number between 1 and 90 (inclusive) and presses the Set button, THE App SHALL update the Pomodoro_Duration to that value, stop any active or paused countdown, and reset the Timer display to the new duration formatted as `MM:SS`.
2. WHEN the user enters a value outside the range 1–90 or a non-numeric value and presses the Set button, THE App SHALL display a Toast with an error message and leave the Pomodoro_Duration and Timer display unchanged.
3. WHEN the App initialises, THE App SHALL restore the Pomodoro_Duration from Local_Storage, or default to `25` minutes if no value is stored.
4. WHEN the Pomodoro_Duration is updated successfully, THE App SHALL persist the new value to Local_Storage.

---

### Requirement 6: Task Creation

**User Story:** As a user, I want to add tasks to my list, so that I can track everything I need to do.

#### Acceptance Criteria

1. WHEN the user enters a non-empty, non-whitespace-only task text of 1–100 characters and presses the Add button or the Enter key, THE Task_Manager SHALL add a new Task with the provided text (trimmed of leading/trailing whitespace) and a `done` status of `false`, clear the input field, and display a success Toast.
2. WHEN a new Task is added, THE Task_Manager SHALL persist the updated Task_List to Local_Storage.
3. IF the user attempts to add a task whose trimmed text (compared case-insensitively) matches the trimmed text of an existing Task in the Task_List, THEN THE Task_Manager SHALL display a Toast warning, SHALL NOT add the duplicate Task, and SHALL keep the input field focused with its text selected.
4. IF the user attempts to add a task with an empty or whitespace-only input, THEN THE Task_Manager SHALL not create a Task and SHALL take no action.
5. WHEN the App initialises, THE Task_Manager SHALL restore the Task_List from Local_Storage, or seed a default list of at least 3 tasks if no persisted list exists.

---

### Requirement 7: Task Completion Toggle

**User Story:** As a user, I want to mark tasks as done or not done, so that I can track my progress through my list.

#### Acceptance Criteria

1. WHEN the user checks the checkbox of a Task, THE Task_Manager SHALL set that Task's `done` status to `true` and apply a visual strikethrough style to its text.
2. WHEN the user unchecks the checkbox of a completed Task, THE Task_Manager SHALL set that Task's `done` status to `false` and remove the strikethrough style.
3. WHEN the `done` status of a Task changes, THE Task_Manager SHALL persist the updated Task_List to Local_Storage.
4. WHEN the `done` status of any Task changes, THE Progress_Tracker SHALL update all of the following: completed count, remaining count, completion percentage, donut-chart arc fill, and motivational quote.
5. WHEN the App initialises and restores the Task_List from Local_Storage, THE Task_Manager SHALL render each Task whose `done` status is `true` with its checkbox checked and strikethrough style applied.

---

### Requirement 8: Task Editing

**User Story:** As a user, I want to edit an existing task's text, so that I can correct mistakes or update its description.

#### Acceptance Criteria

1. WHEN the user clicks the edit button on a Task, THE App SHALL open the task-edit Modal with the input field pre-filled with the current text of that Task and the input focused.
2. WHEN the user submits a non-empty, non-whitespace-only updated text via the Modal, THE Task_Manager SHALL update the Task's text (trimmed), persist the Task_List to Local_Storage, close the Modal, and display a success Toast.
3. IF the user submits empty or whitespace-only text via the edit Modal, THEN THE App SHALL display an error Toast and keep the Modal open with the input field focused.
4. IF the user submits an updated text (trimmed, case-insensitive) that matches the text of a different existing Task, THEN THE App SHALL display a warning Toast and SHALL NOT save the change, keeping the Modal open.

---

### Requirement 9: Task Deletion

**User Story:** As a user, I want to delete individual tasks, so that I can remove items that are no longer relevant.

#### Acceptance Criteria

1. WHEN the user clicks the delete button on a Task, THE Task_Manager SHALL remove that Task from the Task_List before any subsequent user interaction is processed, and SHALL display a success Toast.
2. WHEN a Task is deleted, THE Task_Manager SHALL persist the updated Task_List to Local_Storage.
3. WHEN a Task is deleted, THE Progress_Tracker SHALL update the completed count, remaining count, completion percentage, and donut-chart arc fill to reflect the removal.

---

### Requirement 10: Clear All Tasks

**User Story:** As a user, I want to clear my entire task list in one action, so that I can start fresh without deleting tasks one by one.

#### Acceptance Criteria

1. WHEN the user clicks the "Clear all" button and the Task_List is non-empty, THE App SHALL present a browser confirmation dialog asking the user to confirm the action.
2. WHEN the user confirms the dialog, THE Task_Manager SHALL remove all Tasks from the Task_List.
3. WHEN the Task_List is cleared, THE Task_Manager SHALL persist the empty list to Local_Storage.
4. WHEN the Task_List is cleared, THE Progress_Tracker SHALL update all statistics to reflect zero Tasks.
5. IF the Task_List is already empty when the user clicks "Clear all", THEN THE Task_Manager SHALL not open the confirmation dialog and SHALL take no action.

---

### Requirement 11: Task Sorting

**User Story:** As a user, I want to sort my task list, so that I can view tasks in the order most useful to me.

#### Acceptance Criteria

1. WHEN the user selects the `Default` sort option, THE Task_Manager SHALL display Tasks in their original insertion order (as stored in Local_Storage).
2. WHEN the user selects the `A → Z` sort option, THE Task_Manager SHALL display Tasks sorted alphabetically by text in ascending order using a case-insensitive comparison.
3. WHEN the user selects the `Done Last` sort option, THE Task_Manager SHALL display incomplete Tasks before completed Tasks; within each group, Tasks SHALL retain their original insertion order.
4. THE Task_Manager SHALL apply the selected sort order only to the rendered list without modifying the stored order in Local_Storage.
5. WHEN the App initialises, THE Task_Manager SHALL restore and apply the previously selected sort option from Local_Storage, or default to `Default` if no value is stored.

---

### Requirement 12: Quick Links Management

**User Story:** As a user, I want to save and access my favourite websites with one click, so that I can navigate quickly without typing URLs.

#### Acceptance Criteria

1. WHEN the App initialises and no Link list is found in Local_Storage, THE Quick_Links SHALL load a predefined default set of at least 2 Links.
2. WHEN the App initialises and a Link list is found in Local_Storage, THE Quick_Links SHALL restore that list.
3. WHEN the user opens the add-link Modal, enters a name of 1–30 characters and a valid URL, and presses Save, THE Quick_Links SHALL add a new Link and persist the updated list to Local_Storage.
4. IF the user submits the add-link Modal with an empty or whitespace-only name, THEN THE App SHALL display a Toast with an error message, keep the Modal open, and focus the name field.
5. IF the user submits the add-link Modal with an empty or whitespace-only URL, THEN THE App SHALL display a Toast with an error message, keep the Modal open, and focus the URL field.
6. IF the user submits the add-link Modal with a string that cannot be parsed as a valid URL (even after `https://` prepend), THEN THE App SHALL display a Toast with an error message and keep the Modal open.
7. IF a URL is submitted without an `http` or `https` scheme, THEN THE Quick_Links SHALL prepend `https://` before validation and storage.
8. WHEN the user clicks a Link item, THE App SHALL open the Link's URL in a new browser tab using `noopener,noreferrer`.
9. WHEN the user clicks the delete button on a Link, THE Quick_Links SHALL remove that Link from the list and persist the updated list to Local_Storage.
10. THE Quick_Links SHALL display a favicon image for each Link fetched from the Google Favicon service; IF the image fails to load (error event), THEN THE App SHALL display the first letter of the Link name in a styled fallback element instead.

---

### Requirement 13: Task Progress Tracker

**User Story:** As a user, I want to see a visual summary of my task completion progress, so that I can stay motivated and know how far I have come.

#### Acceptance Criteria

1. WHEN the App initialises and whenever the Task_List changes, THE Progress_Tracker SHALL display the count of Tasks whose `done` status is `true` as the "Completed" count.
2. WHEN the App initialises and whenever the Task_List changes, THE Progress_Tracker SHALL display the count of Tasks whose `done` status is `false` as the "Remaining" count.
3. WHEN the App initialises and whenever the Task_List changes, THE Progress_Tracker SHALL display a completion percentage calculated as `Math.round((done ÷ total) × 100)`, showing `0%` when the Task_List is empty.
4. THE Progress_Tracker SHALL render a donut-chart SVG arc whose filled arc length equals `(completion_percentage ÷ 100) × full_circumference`; WHEN the Task_List is empty, the arc SHALL have zero filled length (fully empty).
5. WHEN the App initialises, THE Progress_Tracker SHALL display the motivational quote corresponding to the initial completion tier.
6. WHEN the completion tier changes (crossing a tier boundary at 0%, 1–49%, 50–74%, 75–99%, or 100%), THE Progress_Tracker SHALL update the motivational quote to the one corresponding to the new tier.

---

### Requirement 14: Light / Dark Theme

**User Story:** As a user, I want to toggle between light and dark modes, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN the user toggles the theme switch to dark, THE App SHALL set `data-theme="dark"` on the root `<html>` element, applying the dark color scheme to all elements styled via that attribute within 350 ms.
2. WHEN the user toggles the theme switch to light, THE App SHALL set `data-theme="light"` on the root `<html>` element, applying the light color scheme to all elements styled via that attribute within 350 ms.
3. WHEN the Theme changes, THE App SHALL persist the selected Theme value (`"light"` or `"dark"`) to Local_Storage; IF Local_Storage is unavailable, THE App SHALL apply the theme in-memory only without displaying an error.
4. WHEN the App initialises, THE App SHALL restore the Theme from Local_Storage and apply it before the first paint; IF the stored value is absent, unrecognised, or corrupted (not `"light"` or `"dark"`), THE App SHALL default to `"light"`.

---

### Requirement 15: Toast Notifications

**User Story:** As a user, I want brief feedback messages for my actions, so that I know whether an operation succeeded or failed.

#### Acceptance Criteria

1. WHEN a user action succeeds — specifically: task added, task edited, task deleted, all tasks cleared, User_Name saved, Link added, Link deleted, Pomodoro_Duration set, or Session completed — THE App SHALL display a Toast with a success style (green background, white text).
2. WHEN a user action fails due to validation — specifically: empty/whitespace task input, duplicate task text, empty/whitespace name input, empty/whitespace link name, empty/whitespace link URL, invalid link URL, or out-of-range Pomodoro duration — THE App SHALL display a Toast with a warning style (amber background, white text).
3. WHEN a Toast is shown, THE App SHALL automatically remove it from the DOM exactly 2.6 seconds after it appears.
4. THE App SHALL support displaying multiple simultaneous Toasts, appending each new Toast above the previous ones in a fixed stack positioned in the bottom-right corner of the viewport.

---

### Requirement 16: Modal Dialogs

**User Story:** As a user, I want focused data-entry dialogs for actions that require input, so that the main Dashboard layout remains uncluttered.

#### Acceptance Criteria

1. WHEN a Modal is opened, THE App SHALL set `overflow: hidden` on the `<body>` element to prevent background scrolling and SHALL display a semi-transparent overlay behind the Modal.
2. WHEN the user clicks the Cancel button inside a Modal, THE App SHALL close the Modal, restore `overflow` on `<body>`, and discard any unsaved input.
3. WHEN the user clicks on the overlay area outside the Modal content box, THE App SHALL close the Modal, restore `overflow` on `<body>`, and discard any unsaved input.
4. WHEN a Modal is open and the user presses the Escape key, THE App SHALL close the Modal, restore `overflow` on `<body>`, and discard any unsaved input.
5. WHEN the user presses the Enter key while focused inside a Modal input field, THE App SHALL trigger the same save/submit action as clicking the Modal's primary action button.

---

### Requirement 17: Sidebar Navigation

**User Story:** As a user, I want a sidebar with navigation links, so that I can quickly scroll to any section of the Dashboard.

#### Acceptance Criteria

1. WHEN the user clicks a navigation item in the sidebar, THE App SHALL smoothly scroll (`behavior: 'smooth'`) the viewport to bring the top of the corresponding Dashboard section into view.
2. WHEN a navigation item is clicked, THE App SHALL add an active CSS class to that item and remove the active CSS class from all other navigation items, providing a distinct visual indication of the currently selected section.

---

### Requirement 18: Responsive Layout

**User Story:** As a user, I want the Dashboard to display correctly on different screen sizes, so that I can use it on desktop, tablet, and mobile devices.

#### Acceptance Criteria

1. WHEN the viewport width is 980 px or less, THE App SHALL display the Timer, Task_Manager, Quick_Links, and Progress_Tracker sections each stacked vertically at 100% of the content-area width (single-column layout).
2. WHEN the viewport width is between 721 px and 980 px, THE Quick_Links SHALL display in a grid of 4 columns.
3. WHEN the viewport width is 720 px or less, THE App SHALL hide the sidebar (translate off-screen or `display: none`) and expand the main content area to 100% of the viewport width.
4. WHEN the viewport width is 720 px or less, THE Quick_Links SHALL display in a grid of 3 columns.

---

### Requirement 19: Technical Constraints

**User Story:** As a developer, I want the app to follow a strict technology and file structure, so that the codebase stays clean, maintainable, and dependency-free.

#### Acceptance Criteria

1. THE App SHALL be implemented using only HTML, CSS, and Vanilla JavaScript — no JavaScript frameworks or libraries (e.g., React, Vue, jQuery) SHALL be used, and no external scripts SHALL be loaded except those explicitly approved (e.g., favicon service image requests).
2. THE App SHALL require no backend server and SHALL make no network requests for data storage or application logic; it SHALL function entirely in Chrome, Firefox, Edge, and Safari without any server dependency.
3. THE App SHALL use only the browser's Local_Storage API for data persistence; no cookies, IndexedDB, sessionStorage, or external APIs SHALL be used for storing user data.
4. THE App SHALL contain exactly one CSS file and exactly one JavaScript file; all styles SHALL be in `css/style.css` and all scripts SHALL be in `js/script.js`.
5. WHEN the App is loaded in current stable versions of Chrome, Firefox, Edge, and Safari, ALL requirements 1–18 SHALL be satisfied and no unhandled JavaScript errors SHALL appear in the browser console.
6. IF the Local_Storage API is unavailable or throws a quota error, THEN THE App SHALL continue to function in-memory for the current session and SHALL display a Toast informing the user that data cannot be saved.
