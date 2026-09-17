# PDF Page Equalizer — Android Release Plan

**Publisher:** Islamic Curriculum Trust Foundation  
**Support email:** suyuuutiiii@gmail.com

## Current status
The working PDF Equalizer web engine already exists. It can equalize PDF page size, visible page artwork, and margins, including exact A5 output.

## Android release path
1. Keep the existing web equalization engine as the core processing logic.
2. Package the interface as an Android application using a secure WebView-based wrapper or equivalent hybrid shell.
3. Ensure Android file picking works through the system document picker.
4. Ensure corrected PDFs can be saved through Android's system save/share flow.
5. Bundle required PDF-processing libraries locally where practical so the installed app does not depend on third-party CDNs to function.
6. Add the app icon, splash screen, version name, version code, privacy-policy link, publisher name, and support email.
7. Build a signed Android App Bundle (.aab) for Google Play.
8. Test on several Android versions and screen sizes before Play Store submission.

## Proposed package identity
- App name: PDF Page Equalizer
- Publisher: Islamic Curriculum Trust Foundation
- Suggested Android package ID: org.islamiccurriculumtrust.pdfequalizer
- Initial version: 1.0.0
- Initial version code: 1
- Suggested category: Productivity

## Core user flow
Select PDF → choose equalizing options → process locally → preview/status → save corrected PDF.

## Required Android behaviours
- Use the Android system document picker for PDF selection.
- Do not request broad storage access when the system picker is sufficient.
- Preserve the approved Exact Equal Visible Size mode.
- Default final page size: A5, 148 × 210 mm.
- Support splitting A4 landscape spreads into two A5 portrait pages.
- Keep the Right page first option for booklet layouts where appropriate.
- Provide clear progress while processing large PDFs.
- Keep the original PDF unchanged.

## Publication assets still needed
- 512 × 512 Play Store icon
- phone screenshots
- feature graphic
- signed Android App Bundle (.aab)
- final Google Play Data safety answers after the Android build is complete

## Privacy policy
Use `privacy.html` in this folder as the public privacy-policy page.
