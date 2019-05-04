exports.writeSummary = (docs) =>
  docs.map(doc => `* [${doc.testName}](#${doc.id})`);
