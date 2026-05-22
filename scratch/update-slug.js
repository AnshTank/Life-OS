db.Project.updateOne({title: /Unified LMS/}, {$set: {slug: 'unified-lms'}});
console.log('Slug update completed.');
