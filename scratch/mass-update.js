db.Project.updateMany({}, {$set: {userId: 'user-1'}});
db.Task.updateMany({}, {$set: {userId: 'user-1'}});
db.Goal.updateMany({}, {$set: {userId: 'user-1'}});
db.Habit.updateMany({}, {$set: {userId: 'user-1'}});
db.JournalEntry.updateMany({}, {$set: {userId: 'user-1'}});
console.log('Mass update completed.');
