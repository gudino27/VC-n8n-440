from .retriever import CourseRetriever


class ContextBuilder:
    """Builds a RAG-augmented prompt by injecting retrieved course context."""

    def __init__(self, retriever: CourseRetriever, top_k: int = 5):
        self.retriever = retriever
        self.top_k = top_k

    def build(self, question: str, base_prompt: str = "") -> tuple[str, list[dict]]:
        """
        Retrieve relevant courses and inject them into the prompt.

        Returns
        -------
        prompt : str
            The full prompt with context injected.
        sources : list[dict]
            The retrieved course entries used as context.
        """
        sources = self.retriever.search(question, top_k=self.top_k)

        context_lines = []
        for entry in sources:
            line = f"- {entry['course_code']}: {entry['chunk_text'][:300]}"
            if entry.get("prereq_raw"):
                line += f" (Prerequisites: {entry['prereq_raw']})"
            context_lines.append(line)

        context_block = "\n".join(context_lines)

        system_prefix = (
            "You are a WSU academic advisor. Use the following course information "
            "to answer the student's question accurately.\n\n"
            "Relevant courses:\n"
            f"{context_block}\n\n"
        )

        if base_prompt:
            prompt = f"{system_prefix}{base_prompt}\n\nQuestion: {question}"
        else:
            prompt = f"{system_prefix}Question: {question}"

        return prompt, sources
