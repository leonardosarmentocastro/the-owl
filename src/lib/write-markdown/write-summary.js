const writeSummary = (docs) =>
  docs.map(doc => `* [${doc.testName}](#${doc.id})`);

export default writeSummary;
