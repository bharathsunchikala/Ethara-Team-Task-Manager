import argparse
import asyncio
import json
from pathlib import Path
from typing import Any

from app.ai.planner import generate_project_plan

DATASET_PATH = Path(__file__).parents[2] / "evals" / "project_plan_cases.jsonl"


def load_cases(path: Path = DATASET_PATH) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


async def evaluate(provider: str) -> dict[str, Any]:
    cases = load_cases()
    schema_passes = 0
    citation_total = 0
    invalid_citations = 0
    required_total = 0
    required_matches = 0
    expected_total = 0
    retrieved_expected = 0
    latencies = []
    results = []

    for case in cases:
        plan, metadata = await generate_project_plan(
            case["goal"], case["project"], case["tasks"], provider=provider
        )
        plan_data = plan.model_dump()
        schema_passes += 1
        allowed_sources = {item["id"] for item in metadata["evidence"]}
        citations = [
            source_id
            for milestone in plan.milestones
            for task in milestone.tasks
            for source_id in task.source_task_ids
        ]
        citation_total += len(citations)
        invalid_citations += sum(source_id not in allowed_sources for source_id in citations)
        expected = set(case["must_retrieve_ids"])
        expected_total += len(expected)
        retrieved_expected += len(expected & allowed_sources)
        searchable_output = json.dumps(plan_data, ensure_ascii=False).casefold()
        required_total += len(case["required_terms"])
        required_matches += sum(term.casefold() in searchable_output for term in case["required_terms"])
        latencies.append(metadata["duration_ms"])
        results.append(
            {
                "id": case["id"],
                "schema_valid": True,
                "retrieved_expected_ids": sorted(expected & allowed_sources),
                "cited_ids": citations,
                "required_terms_found": [
                    term for term in case["required_terms"] if term.casefold() in searchable_output
                ],
                "duration_ms": metadata["duration_ms"],
            }
        )

    return {
        "provider": provider,
        "sample_count": len(cases),
        "schema_pass_rate": schema_passes / len(cases) if cases else 0,
        "retrieval_recall_at_6": retrieved_expected / expected_total if expected_total else 0,
        "citation_precision": (citation_total - invalid_citations) / citation_total if citation_total else 1,
        "required_term_coverage": required_matches / required_total if required_total else 0,
        "mean_latency_ms": round(sum(latencies) / len(latencies), 2) if latencies else 0,
        "cases": results,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate project planning quality on the local golden set.")
    parser.add_argument("--provider", choices=("demo", "openai"), default="demo")
    arguments = parser.parse_args()
    print(json.dumps(asyncio.run(evaluate(arguments.provider)), indent=2))