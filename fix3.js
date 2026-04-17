const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');
let lines = c.split('\n');

console.log('Total lines:', lines.length);

// 1. Remove wrong line 949 (imagePublicId outside any model)
if (lines[948] && lines[948].includes('imagePublicId')) {
 console.log('Removing line 949:', lines[948].trim());
 lines.splice(948, 1);
}

// 2. Add imagePublicId inside HomeSlider (after "image String")
let homeSliderEnd = -1;
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('model HomeSlider {')) {
 // Find the closing of HomeSlider
 for (let j = i + 1; j < lines.length; j++) {
 if (lines[j].trim() === '}' && lines[j].startsWith(' }')) {
 homeSliderEnd = j;
 break;
 }
 }
 // Find image String line inside HomeSlider
 for (let j = i + 1; j < homeSliderEnd; j++) {
 if (lines[j].includes('image String') && !lines[j].includes('PublicId')) {
 console.log('Found HomeSlider.image at line', j+1, ':', lines[j].trim());
 lines.splice(j + 1, 0, ' imagePublicId String? @map("image_public_id")');
 homeSliderEnd++; // adjust for insertion
 break;
 }
 }
 break;
}
if (homeSliderEnd < 0) console.log('ERROR: HomeSlider not found');

// 3. Fix HomeVideo: add "model HomeVideo {" declaration and thumbnailPublicId
let homeVideoStart = -1;
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('@map("home_videos")')) {
 homeVideoStart = i;
 break;
 }
}
if (homeVideoStart >= 0) {
 // The content before @map("home_videos") belongs to HomeVideo
 // Find the first line of this content
 let contentStart = homeVideoStart;
 while (contentStart > 0 && !lines[contentStart].includes('model ') && !lines[contentStart].startsWith('}')) {
 contentStart--;
 }
 contentStart++; // move past the model declaration or }
 if (lines[contentStart].trim() === '}') contentStart++;

 // Insert model declaration
 console.log('Inserting model HomeVideo { before line', contentStart+1);
 lines.splice(contentStart, 0, 'model HomeVideo {');

 // Find thumbnail String? inside HomeVideo
 for (let j = contentStart + 1; j < homeVideoStart; j++) {
 if (lines[j].includes('thumbnail String?') && !lines[j].includes('PublicId')) {
 console.log('Found HomeVideo.thumbnail at line', j+1, ':', lines[j].trim());
 lines.splice(j + 1, 0, ' thumbnailPublicId String? @map("thumbnail_public_id")');
 break;
 }
 }

 // Remove orphan }
 for (let j = homeVideoStart + 1; j < lines.length; j++) {
 if (lines[j].trim() === '}' && !lines[j].includes('@map')) {
 console.log('Removing orphan } at line', j+1);
 lines.splice(j, 1);
 break;
 }
 }
}

// 4. Add Advertisement.thumbnailPublicId
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('thumbnailUrl String? @map("thumbnail_url")')) {
 console.log('Found Advertisement.thumbnailUrl at line', i+1, ':', lines[i].trim());
 lines.splice(i + 1, 0, ' thumbnailPublicId String? @map("thumbnail_public_id")');
 break;
 }
}

// 5. Add WebTemplate.thumbnailPublicId and screenshotsPublicIds
let webTemplateStart = -1;
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('model WebTemplate {')) {
 webTemplateStart = i;
 }
}
if (webTemplateStart >= 0) {
 let webTemplateEnd = -1;
 for (let j = webTemplateStart + 1; j < lines.length; j++) {
 if (lines[j].trim() === '}' && lines[j].startsWith(' }')) {
 webTemplateEnd = j;
 break;
 }
 }
 if (webTemplateEnd >= 0) {
 // Find thumbnail String (non-null)
 for (let j = webTemplateStart + 1; j < webTemplateEnd; j++) {
 if (lines[j].includes('thumbnail String') && !lines[j].includes('PublicId') && lines[j].includes('@map("thumbnail")')) {
 console.log('Found WebTemplate.thumbnail at line', j+1, ':', lines[j].trim());
 lines.splice(j + 1, 0, ' thumbnailPublicId String? @map("thumbnail_public_id")');
 webTemplateEnd++;
 break;
 }
 }
 // Find screenshots String[]
 for (let j = webTemplateStart + 1; j < webTemplateEnd; j++) {
 if (lines[j].includes('screenshots String[]') && !lines[j].includes('PublicIds')) {
 console.log('Found WebTemplate.screenshots at line', j+1, ':', lines[j].trim());
 lines.splice(j + 1, 0, ' screenshotsPublicIds String[] @map("screenshots_public_ids")');
 webTemplateEnd++;
 break;
 }
 }
}

// 6. Add Course.thumbnailPublicId
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('thumbnail String? @map("thumbnail")') && !lines[i].includes('PublicId')) {
 // Check if this is inside Course model
 let inCourse = false;
 for (let j = i - 1; j >= 0; j--) {
 if (lines[j].includes('model Course {')) { inCourse = true; break; }
 if (lines[j].startsWith('model ')) break;
 }
 if (inCourse) {
 console.log('Found Course.thumbnail at line', i+1, ':', lines[i].trim());
 lines.splice(i + 1, 0, ' thumbnailPublicId String? @map("thumbnail_public_id")');
 break;
 }
 }
}

// 7. Add Instructor.avatarPublicId
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('avatar String? @map("avatar")') && !lines[i].includes('PublicId')) {
 console.log('Found Instructor.avatar at line', i+1, ':', lines[i].trim());
 lines.splice(i + 1, 0, ' avatarPublicId String? @map("avatar_public_id")');
 break;
 }
}

// Final verification
let pubIdCount = 0;
for (const line of lines) {
 if (line.includes('PublicId') || line.includes('publicId')) {
 if (!line.trim().startsWith('//')) {
 pubIdCount++;
 console.log('PublicId line:', line.trim().substring(0, 70));
 }
 }
}
console.log('\nTotal PublicId fields:', pubIdCount);

fs.writeFileSync('prisma/schema.prisma', lines.join('\n'));
console.log('\nSchema updated.');
