import { store } from '../redux';
import { kebabCase } from 'lodash/string';

const createDocs = () => {
  const state = store.getState();
  const docs = Object.values(state.docs.byId);
  if (!docs) return null; // Idempotent: no need to generate docs if there are no registries.

  const heading = writeHeading(docs[0]);
  const summary = docs.map(writeSummaryItem).join('\r\n');
  const definitions = docs.map(writeDefinitions).join('\r\n');

  return writeDoc(heading, summary, definitions);
};

const writeDoc = (heading, summary, definitions) =>
`${heading}

## Summary

${summary}

---

${definitions}
`;

export const writeRequestDefinitions = (doc) =>
`### Request

* Method: ${doc.request.method.toUpperCase()}

${doc.request.headers &&
  `* Headers:

  \`\`\`json
  ${doc.request.headers}
  \`\`\`
  `.trim()
}

${doc.request.body &&
  `* Body:

  \`\`\`json
  ${doc.request.body}
  \`\`\`
  `.trim()
}
`;

export const writeResponseDefinitions = (doc) =>
`
### Response

* Status: ${doc.response.statusCode}

${doc.response.headers &&
  `* Headers:

  \`\`\`json
  ${doc.response.headers}
  \`\`\`
  `.trim()
}

${doc.response.body &&
  `* Body:

  \`\`\`json
  ${doc.response.body}
  \`\`\`
  `.trim()
}
`;

export const writeDefinitions = (doc) =>
`## ${doc.testName}

${writeRequestDefinitions(doc)}

${writeResponseDefinitions(doc)}
`;

export const writeHeading = (doc) =>
`# [${doc.request.method.toUpperCase()}] ${doc.request.path}`;

// NOTE: check if "ancoring to item" will work with the title in kebab case.
export const writeSummaryItem = (doc) =>
  `* [${doc.testName}](#${kebabCase(doc.testName.trim())})`

  //// Doc shape:
  // `
  //   # [GET] /users/:id

  //   ## Summary

  //   * (200) returns the given user if it exists
  //   * (500) returns an error if the given user doesnt exist

  //   ---

  //   ## (200) returns the given user if it exists

  //   ### Request

  //   * Method: ${doc.request.method.toUpperCase()}

  //   ${doc.request.headers &&
  //     `* Headers:

  //     \`\`\`json
  //     ${doc.request.headers}
  //     \`\`\`
  //     `.trim()
  //   }

  //   ${doc.request.body &&
  //     `* Body:

  //     \`\`\`json
  //     ${doc.request.body}
  //     \`\`\`
  //     `.trim()
  //   }

  //   ### Response

  //   * Status: ${doc.response.statusCode}

  //   ${doc.response.headers &&
  //     `* Headers:

  //     \`\`\`json
  //     ${doc.response.headers}
  //     \`\`\`
  //     `.trim()
  //   }

  //   ${doc.response.body &&
  //     `* Body:

  //     \`\`\`json
  //     ${doc.response.body}
  //     \`\`\`
  //     `.trim()
  //   }
  // `

export default createDocs;
