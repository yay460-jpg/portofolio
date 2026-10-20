# Employee profile photos

Store one employee profile photo per registered NIK record in this folder.

## File naming

Name each photo using the exact `Id No (NIK)` value from the canonical A3 NIK sheet, followed by one supported extension:

- `<NIK-ID>.jpg`
- `<NIK-ID>.jpeg`
- `<NIK-ID>.png`
- `<NIK-ID>.webp`

Example: `TEST-NIK-001.jpg`.

Use the **View** button in List NIK to preview the matching photo. Photos are served by the local Desktop Host profile endpoint; the Database folder is not exposed as a general static directory. The original image selected in the Upload Photo control must be 2 MB or smaller. The app compresses it to a JPEG of 100 KB or smaller before saving. New uploads replace the existing profile image for that NIK.
