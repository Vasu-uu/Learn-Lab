/*
  Course template. Copy this folder to courses/<your-course>, edit below,
  then add the folder name to courses/courses.js.
*/
CV.defineCourse({
  id: 'my-course',                 // short, unique, used in URLs: #/c/my-course
  title: 'My Next Course',
  subtitle: 'From zero to useful',
  desc: 'One or two sentences that appear on the dashboard card.',
  glyph: 'MC',                     // 1–3 letters shown on the course badge
  parts: [
    { n: 1, title: 'Foundations', desc: 'What this part covers.' },
    { n: 2, title: 'Going further', desc: '' },
  ],
  files: [
    // 'widgets/my-demos.js',      // optional: your own interactive demos
    'lessons.js',
  ],
});
