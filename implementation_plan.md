# Integration of Glassmorphism Coming Soon Modal and Auth Redesign

This implementation plan details the steps to fully integrate the centralized, premium glassmorphism `comingSoonModal.js` experience across the CODECOLLAB platform. We will import this module across all HTML pages, replace generic browser alerts with the new modal, and polish the styling/interaction flows of under-development features.

## User Review Required

> [!IMPORTANT]
> - **Centralized Event Interceptor**: The `comingSoonModal.js` module automatically intercepts clicks on elements containing `data-coming-soon` or those with `href="#"` (except links with the `nav-item` class). We will ensure this doesn't conflict with existing navigation elements.
> - **Replacing Inline Modals**: We will deprecate and remove the redundant inline `#login-modal` markup in `index.html` since `comingSoonModal.js` provides a cleaner, dynamically generated glassmorphism modal with identical or improved messaging.

## Open Questions

- None at the moment. The plan covers direct integrations of the modal script and replacements of plain JS alerts.

---

## Proposed Changes

### Centralized Services

We will verify `comingSoonModal.js` and use it as the platform-wide service for unimplemented features.

#### [MODIFY] [comingSoonModal.js](file:///c:/Users/DELL/Downloads/overall/CODECOLLAB/services/comingSoonModal.js)
- Ensure the click event listener is fully compatible with relative directories.
- Add support for custom warning dialogs if needed.

---

### Home Page & Navigation

Integrating the modal script and removing obsolete modal placeholders from the main homepage.

#### [MODIFY] [index.html](file:///c:/Users/DELL/Downloads/overall/CODECOLLAB/index.html)
- Add `<script src="services/comingSoonModal.js"></script>` to load the dynamic modal service.
- Remove the inline `#login-modal` block (lines 84-94) since it is now dynamically handled via `comingSoonModal.js`.
- Tag any stub links (like "+ Add Project" if needed or secondary links) to test interaction.

---

### User Dashboard Component

Replacing plain javascript alert boxes with premium custom modals.

#### [MODIFY] [index.html](file:///c:/Users/DELL/Downloads/overall/CODECOLLAB/user_dashboard_system/index.html)
- Add `<script src="../services/comingSoonModal.js"></script>` before the dashboard logic script.

#### [MODIFY] [dashboard page ka logic Javascript file.js](file:///c:/Users/DELL/Downloads/overall/CODECOLLAB/user_dashboard_system/dashboard%20page%20ka%20logic%20Javascript%20file.js)
- Locate the "View Request" button handler:
  ```javascript
  // Change from:
  onclick="alert('Request details coming soon!')"
  // To:
  onclick="window.CodeCollabComingSoon.show('Request Details Coming Soon', 'Detailed tracking of your request is under development and will be available in a future update.', '📊')"
  ```

---

### Project Details Component

Enhance feedback on details actions.

#### [MODIFY] [index.html](file:///c:/Users/DELL/Downloads/overall/CODECOLLAB/all_projects/index.html)
- Add `<script src="../services/comingSoonModal.js"></script>`.

#### [MODIFY] [project detail page ka logic Javascript file.js](file:///c:/Users/DELL/Downloads/overall/CODECOLLAB/all_projects/project%20detail%20page%20ka%20logic%20Javascript%20file.js)
- Replace generic browser alerts with the custom glassmorphism modal:
  - Replace `alert("GitHub repository not linked for this project.");` with `window.CodeCollabComingSoon.show("GitHub Link Unavailable", "A GitHub repository has not been linked for this project yet. Please check back later.", '💻');`
  - Replace other raw alerts (e.g. duplicate applications) with custom modal notifications if desired.

---

### Admin & User Settings

Replacing alert windows and styling under-development actions.

#### [MODIFY] [add project page.html](file:///c:/Users/DELL/Downloads/overall/CODECOLLAB/admin_and_user_settings/add%20project%20page.html)
- Add `<script src="../services/comingSoonModal.js"></script>`.

#### [MODIFY] [index.html](file:///c:/Users/DELL/Downloads/overall/CODECOLLAB/admin_and_user_settings/index.html)
- Add `<script src="../services/comingSoonModal.js"></script>`.

#### [MODIFY] [project management page ka logic Javascript file.js](file:///c:/Users/DELL/Downloads/overall/CODECOLLAB/admin_and_user_settings/project%20management%20page%20ka%20logic%20Javascript%20file.js)
- Replace `alert("Request " + newStatus + "!");` with `window.CodeCollabComingSoon.show("Request Status Updated", "The join request has been successfully " + newStatus.toLowerCase() + ".", "✓");`.

---

### Authentication Module

Redesigning plain alerts and stubs in the auth flow.

#### [MODIFY] [auth.html](file:///c:/Users/DELL/Downloads/overall/CODECOLLAB/auth.html)
- Add `<script src="services/comingSoonModal.js"></script>`.
- Replace the "Forgot Password?" inline handler:
  ```javascript
  // Change from:
  onclick="alert('Password reset system is currently under maintenance. Please contact support.')"
  // To:
  onclick="window.CodeCollabComingSoon.show('Password Reset Offline', 'The password reset system is currently under maintenance. Please contact support.', '🔑')"
  ```

---

## Verification Plan

### Manual Verification
1. Open `index.html` locally in a browser.
2. Click "Join us" and verify that the glassmorphism "Authentication Coming Soon" modal opens. Check that ESC key, clicking background, and "Acknowledge" button close the modal.
3. Login and navigate to the Dashboard (`user_dashboard_system/index.html`).
4. Click "View Request" on any request card and verify that the premium modal is displayed instead of the browser's default alert dialog.
5. Navigate to a project detail page (`all_projects/index.html?id=1`).
6. Click "View on GitHub" for a project without a linked repo and check for the modal.
7. Navigate to the Manage Requests page (`admin_and_user_settings/index.html`) and check that approving or rejecting a request prompts a custom modal instead of an alert.
8. Go to `auth.html` and click "Forgot Password?", verifying that the custom modal is triggered.
