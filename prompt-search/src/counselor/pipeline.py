import os
import sys

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from llm.claude_client import ClaudeClient
from prompts.template import PromptTemplate
from prompts.mutations import PromptMutator
from retrieval.retriever import CourseRetriever
from counselor.prereq_checker import PrereqChecker
from counselor.grad_advisor import GradAdvisor


def _build_template(context_chunks: list) -> PromptTemplate:
    context = "\n\n---\n\n".join(c["chunk_text"] for c in context_chunks)
    template = PromptTemplate(
        task_description=(
            f"Use the following WSU course catalog information to answer the student's question.\n\n"
            f"Catalog context:\n{context}"
        )
    )
    template = PromptMutator.add_domain_context(template, "course_planning")
    template = PromptMutator.add_cot(template)
    return template


class VirtualCounselorPipeline:
    def __init__(self, index_dir: str = "data/domain", api_key: str = None):
        self.retriever = CourseRetriever(index_dir=index_dir)
        self.checker = PrereqChecker(self.retriever)
        self.advisor = GradAdvisor(self.retriever)
        resolved_key = api_key or os.environ.get("CLAUDE_API_KEY")
        if not resolved_key:
            raise EnvironmentError(
                "CLAUDE_API_KEY is not set. Add it to prompt-search/.env:\n"
                "  CLAUDE_API_KEY=your_key_here"
            )
        self.client = ClaudeClient(model="claude-haiku-4-5", api_key=resolved_key)

    def ask(self, question: str, completed_courses: list = None) -> str:
        completed_courses = completed_courses or []

        # Retrieve relevant catalog chunks for context
        chunks = self.retriever.search(question, top_k=5)
        template = _build_template(chunks)

        # Augment question with student context if provided
        student_context = ""
        if completed_courses:
            student_context = f"\nMy completed courses: {', '.join(completed_courses)}\n"

        prompt = template.render(student_context + question)
        return self.client.generate(prompt, max_tokens=800)

    def can_take(self, course_code: str, completed_courses: list = None) -> dict:
        completed_courses = completed_courses or []
        result = self.checker.check(course_code, completed_courses)

        if not result["found"]:
            answer = f"Course {course_code} was not found in the catalog."
        elif result["can_take"]:
            answer = f"Yes, you can take {course_code}. All prerequisites are satisfied."
            if result["prereqs"]:
                answer += f" (Required: {', '.join(result['prereqs'])})"
        else:
            answer = (
                f"No, you cannot take {course_code} yet. "
                f"You are missing these prerequisites: {', '.join(result['missing'])}."
            )
            if result["completed"]:
                answer += f" You have already completed: {', '.join(result['completed'])}."

        result["answer"] = answer
        return result

    def graduation_check(self, degree_program: str, completed_courses: list = None) -> dict:
        completed_courses = completed_courses or []
        result = self.advisor.get_remaining(degree_program, completed_courses)

        if not result["remaining"]:
            answer = (
                f"Based on catalog requirements found, you appear to have completed "
                f"all {len(result['completed_matches'])} identifiable courses for {degree_program}."
            )
        else:
            answer = (
                f"For {degree_program}, you still need {len(result['remaining'])} course(s): "
                f"{', '.join(result['remaining'][:10])}"
            )
            if len(result["remaining"]) > 10:
                answer += f" ... and {len(result['remaining']) - 10} more."

        result["answer"] = answer
        return result
