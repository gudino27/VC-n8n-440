class EvaluationMetrics:
    @staticmethod
    def accuracy(predictions: list[str], ground_truth: list[str]) -> float:
        if not ground_truth:
            return 0.0
        correct = sum(
            gt.strip().lower() in pred.strip().lower()
            for pred, gt in zip(predictions, ground_truth)
        )
        return correct / len(ground_truth)

    @staticmethod
    def pass_at_k(predictions: list[list[str]], ground_truth: list[str], k: int) -> float:
        """At least 1 of k samples is correct for each example."""
        if not ground_truth:
            return 0.0
        passed = 0
        for samples, gt in zip(predictions, ground_truth):
            top_k = samples[:k]
            if any(gt.strip().lower() in pred.strip().lower() for pred in top_k):
                passed += 1
        return passed / len(ground_truth)

    @staticmethod
    def token_cost(
        usage_stats: dict,
        cost_per_1k_input: float = 0.00025,
        cost_per_1k_output: float = 0.00125,
    ) -> float:
        input_tokens = usage_stats.get("input_tokens", 0)
        output_tokens = usage_stats.get("output_tokens", 0)
        return (input_tokens / 1000) * cost_per_1k_input + (output_tokens / 1000) * cost_per_1k_output

    @staticmethod
    def normalized_score(score: float, baseline_score: float) -> float:
        """Improvement over baseline as a ratio. Returns 0 if baseline is 0."""
        if baseline_score == 0:
            return 0.0
        return (score - baseline_score) / baseline_score
