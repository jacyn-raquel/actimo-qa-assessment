# Automation QA Engineer Technical Assessment

## Part 1: Prioritized Test Plan

| ID | Scenario | Priority | Rationale |
| --- | --- | --- | --- |
| MSG-01 | Create a new message and save it successfully. | Critical | Message creation is the entry point for the whole feature. |
| MSG-02 | Rename a message and verify the title persists after save and reopen. | High | Basic message management must be reliable. |
| MSG-03 | Add a `Grid` module with multiple tiles and verify tile content persists after save and reopen. | Critical | Grid appears to be a primary navigation pattern in the message flow. |
| MSG-04 | Configure grid tile text, icon, text color, overlay color, and background image and verify the preview updates correctly. | High | Grid tiles combine several editable properties that can easily regress. |
| MSG-05 | Add grid tile images using upload, media library, and free image search, and verify the selected image is applied to the correct tile. | High | The recording shows several image-source paths that should behave consistently. |
| MSG-06 | Add a valid grid tile URL action and verify the action is saved correctly, including the `Open page in new window` option. | High | Navigation actions are a core part of message usability. |
| MSG-07 | Enter invalid grid action input and verify validation blocks bad configuration. | Critical | Invalid navigation should be prevented before publish. |
| MSG-08 | Add a `Feed` module using `Feed with messages` and verify settings such as item count, sort order, and date display are saved correctly. | High | Feed configuration affects how content is surfaced to end users. |
| MSG-09 | Add a `Text` module with formatting and merge fields, save the message, reopen it, and verify the content is preserved. | Critical | Rich text plus personalization is a high-value authoring flow. |
| MSG-10 | Add a `Video` module with a YouTube URL and verify the content is accepted and rendered in preview. | High | External media embedding is visible in the recording and prone to input issues. |
| MSG-11 | Upload an audio file to an `Audio` module and verify upload state and final rendering behave correctly. | High | File upload reliability is a common defect area. |
| MSG-12 | Configure an image-based `Quiz` with answer options, correct-answer selection, and text feedback, then verify all settings persist. | High | Quiz setup includes both content and validation logic. |
| MSG-13 | Verify invalid quiz setup is blocked, such as incomplete answers or no correct answer when required. | High | Invalid quiz content should not be published. |
| MSG-14 | Add a `Confirm` module and verify the configured button text and confirmed state display correctly in preview. | Medium | This is a simpler module but still part of the validation flow shown in the recording. |
| MSG-15 | Configure a `Survey` question with multiple answer buttons and verify button text, ordering, and single-choice behavior save correctly. | High | Survey answers are user-facing and easy to misconfigure. |
| MSG-16 | Configure a `Slider` module with range values, smile mode, explanation text, submit button text, and follow-up behavior, then verify preview behavior matches the configuration. | High | Slider has several configurable settings and visible interaction behavior. |
| MSG-17 | Configure an `Upload` module and verify upload CTA, allowed interaction flow, and preview behavior work correctly. | Medium | Upload handling is valuable but slightly lower priority than authoring basics. |
| MSG-18 | Configure the `Feedback` module with placeholder text, submit button text, clicked-state text, and optional action, then verify everything persists after save. | High | Free-text feedback is user-facing and has multiple editable states. |
| MSG-19 | Enable and disable social options for `Reactions`, `Comments`, and `Share`, and verify the preview updates accordingly. | High | Social controls directly affect available end-user interactions. |
| MSG-20 | Configure `Advanced settings` such as theme, menu, insights, language, styling, and button appearance, then verify the message preview reflects those settings. | High | The recording shows a large amount of message-level configuration in this area. |
| MSG-21 | Configure a side `Menu` with sections, items, icons, and labels, and verify it is attached to the message correctly. | Medium | Menu configuration is secondary, but still part of the visible message setup. |
| MSG-22 | Use test mode / preview and verify configured modules behave correctly for an end user, including confirm, survey, slider, upload, feedback, and social interactions. | Critical | End-to-end preview gives confidence that the authored message works in practice. |
| MSG-23 | In `Publish`, verify content preview, categories, notifications, and advanced publish settings are saved correctly. | High | Publish configuration affects how the content is presented and distributed. |
| MSG-24 | Verify advanced publish controls such as `Ask to add to home screen`, `Allow unsubscribe`, `Anonymise statistics`, and `Automation` can be configured and persisted. | High | These settings have downstream delivery and reporting impact. |
| MSG-25 | Add recipients through the publish flow and verify the audience assignment is correct. | Critical | Recipient setup is required before delivery and is part of the assessment scope. |
| MSG-26 | Attempt to publish with missing required setup and verify the system blocks the action or gives clear guidance. | Critical | Invalid content should not reach recipients. |
| MSG-27 | Publish a valid message and verify the publish action completes successfully. | Critical | This is the main business outcome of the feature. |
| MSG-28 | Open the `Analytics` tab for a published message and verify delivery and engagement data loads correctly. | High | Reviewing delivery results is explicitly required in the assessment brief. |

## Part 2: Test Automation

The first three test cases I would automate are:

1. Create a message, add a `Text` module with merge fields, save it, reopen it, and verify the content persists.
2. Configure a `Grid` tile with content and an action, then verify valid input is saved and invalid input is blocked.
3. Configure publish settings and verify the message remains publish-ready after save and reopen.

I selected these cases first because they cover the most valuable and repeatable parts of the message flow shown in the recording: core authoring, validation, and publish configuration. Together they verify that a message can be built, that common misconfigurations are caught early, and that the message can be prepared for release without losing settings. I did not prioritize analytics first because those checks are usually more dependent on seeded data and asynchronous processing. This gives fast, stable feedback on the most important areas before expanding the suite further.
