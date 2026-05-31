export async function completeCompanyOnboarding<TInput, TDoc>(
  input: TInput,
  {
    generateKnowledgeDoc,
    persistKnowledgeDoc,
    markComplete,
  }: {
    generateKnowledgeDoc: (input: TInput) => Promise<TDoc>;
    persistKnowledgeDoc: (input: TInput, doc: TDoc) => Promise<void>;
    markComplete: () => Promise<void>;
  },
) {
  const doc = await generateKnowledgeDoc(input);
  await persistKnowledgeDoc(input, doc);
  await markComplete();
  return doc;
}
