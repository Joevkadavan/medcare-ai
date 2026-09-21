# Corpus provenance and refresh

The versioned corpus contains reviewed paraphrases, not copied full articles. It was checked against these NHS source pages on 2026-09-21:

- https://www.nhs.uk/symptoms/fever-in-adults/
- https://www.nhs.uk/symptoms/headaches/
- https://www.nhs.uk/symptoms/cough/
- https://www.nhs.uk/symptoms/tiredness-and-fatigue/
- https://www.nhs.uk/conditions/stroke/symptoms/
- https://www.nhs.uk/symptoms/shortness-of-breath/

Each JSON passage records its supporting section, URL, verification date and unique ID. Regional service numbers were generalized to local emergency services. Medication recommendations were excluded. The answer composer only displays these reviewed paraphrases and appends citations; the source snippet and displayed cited sentence must match.

To refresh: open each authoritative page; check each passage against its named section; revise or remove unsupported material; update verified_on only after checking; run backend and browser tests. Add topics through both corpus entries and TOPICS in retriever.py, with tests for relevance, refusal and source mapping. Do not claim comprehensive coverage or clinical validation. A page verification date is distinct from the publisher's review date.

BM25 is a lexical retrieval algorithm. Scores measure relevance to query terms; they are not medical probabilities. This prototype deliberately does not use the old hashed pseudo-embeddings. Production expansion requires clinical governance and a reviewed ingestion pipeline, not simply adding untrusted uploaded material.
