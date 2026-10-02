import { useEffect, useState } from "react";
import { AlertTriangle, BrainCircuit, Clock3, FileText, Sparkles } from "lucide-react";
import { projectsApi } from "../api/projects";
import { aiApi } from "../api/ai";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Select from "../components/ui/Select";
import Textarea from "../components/ui/Textarea";

const AICopilot = () => {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    projectsApi
      .list({ limit: 100 })
      .then(({ data }) => {
        if (!active) return;
        const availableProjects = data.data || [];
        setProjects(availableProjects);
        setProjectId(availableProjects[0]?._id || "");
      })
      .catch(() => {
        if (active) setError("Could not load projects. Check the main API connection.");
      })
      .finally(() => {
        if (active) setLoadingProjects(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!projectId || goal.trim().length < 12 || generating) return;
    setGenerating(true);
    setError("");
    setResult(null);
    try {
      const response = await aiApi.createProjectPlan(projectId, goal.trim());
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "The AI planner could not complete this request.");
    } finally {
      setGenerating(false);
    }
  };

  const evidenceById = new Map((result?.metadata?.evidence || []).map((item) => [item.id, item]));

  return (
    <div>
      <PageHeader
        title="AI Project Copilot"
        description="Turn a project goal into an evidence-linked delivery plan."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm shadow-cyan-100/60">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800">
              <BrainCircuit size={20} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">Plan a project goal</h2>
              <p className="text-sm text-slate-500">Uses project tasks as retrieval context</p>
            </div>
          </div>

          {loadingProjects ? (
            <LoadingSpinner label="Loading your projects" />
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4">
              <Select
                label="Project"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                disabled={projects.length === 0}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </Select>
              <Textarea
                label="Goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                rows={6}
                maxLength={1000}
                placeholder="Example: Prepare the team to launch a self-service onboarding flow next quarter. Include discovery, implementation, and launch validation."
              />
              <p className="-mt-2 text-xs text-slate-500">{goal.length}/1000 characters; at least 12 required.</p>
              <Button
                type="submit"
                isLoading={generating}
                disabled={!projectId || goal.trim().length < 12 || generating}
                className="w-full"
              >
                <Sparkles size={17} />
                Generate plan
              </Button>
              {projects.length === 0 && !error && (
                <p className="text-sm text-slate-500">Create or join a project before planning.</p>
              )}
            </form>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </p>
          )}
        </section>

        <section aria-live="polite" className="min-w-0">
          {generating ? (
            <div className="rounded-lg border border-cyan-100 bg-white p-6">
              <LoadingSpinner label="Retrieving project context and drafting a plan" />
            </div>
          ) : result ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-cyan-800">Generated plan</p>
                  <h2 className="text-xl font-semibold text-slate-950">{result.plan.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{result.plan.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-md bg-cyan-50 px-2.5 py-1.5">{result.metadata.provider} · {result.metadata.model}</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1.5">
                    <Clock3 size={13} /> {result.metadata.duration_ms} ms
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {result.plan.milestones.map((milestone, index) => (
                  <article key={`${milestone.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-cyan-800">Milestone {index + 1}</p>
                    <h3 className="mt-1 font-semibold text-slate-950">{milestone.title}</h3>
                    <p className="mt-2 text-sm leading-5 text-slate-600">{milestone.outcome}</p>
                    <ul className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                      {milestone.tasks.map((task, taskIndex) => (
                        <li key={`${task.title}-${taskIndex}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900">{task.title}</p>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{task.priority}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{task.description}</p>
                          {task.source_task_ids?.length > 0 && (
                            <p className="mt-1 text-xs text-cyan-800">
                              Based on: {task.source_task_ids.map((id) => evidenceById.get(id)?.title || id).join(", ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <InfoList title="Risks" icon={AlertTriangle} items={result.plan.risks} />
                <InfoList title="Open questions" icon={FileText} items={result.plan.open_questions} />
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Retrieved project evidence</h3>
                  <span className="text-xs text-slate-500">
                    {result.metadata.context_task_count} tasks · {result.metadata.prompt_tokens} input / {result.metadata.completion_tokens} output tokens
                  </span>
                </div>
                {result.metadata.evidence.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No existing tasks were available; the plan is based only on the goal.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-100">
                    {result.metadata.evidence.map((item) => (
                      <li key={item.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                        <span className="font-medium text-slate-800">{item.title}</span>
                        <span className="text-xs text-slate-500">{item.status} · relevance {item.relevance}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
              <BrainCircuit className="mb-3 text-cyan-800" size={28} />
              <h2 className="font-semibold text-slate-900">A plan grounded in your project</h2>
              <p className="mt-2 max-w-md text-sm leading-5 text-slate-600">
                Select a project and describe the outcome. The planner retrieves relevant tasks, generates a structured plan, and shows its evidence and runtime metadata.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const InfoList = ({ title, icon: Icon, items }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Icon size={16} />{title}</h3>
    {items.length ? (
      <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-600">
        {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
    ) : <p className="mt-3 text-sm text-slate-500">None identified.</p>}
  </section>
);

export default AICopilot;