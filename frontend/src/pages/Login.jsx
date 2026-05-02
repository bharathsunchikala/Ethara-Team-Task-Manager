import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Logo from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.email) nextErrors.email = "Email is required";
    if (!form.password) nextErrors.password = "Password is required";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(form);
      toast.success("Welcome back");
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_520px]">
      <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo className="rounded-lg bg-white px-3 py-2" imageClassName="h-12" />
        <div className="max-w-xl">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-300">
            Portfolio-ready MERN workspace
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Projects, tasks, team permissions, and delivery visibility in one place.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Admins manage projects and assignments. Members focus on their own work and update
            progress without noisy permissions.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div>
            <Logo className="mb-5" imageClassName="h-12 max-w-[230px]" />
            <h1 className="text-2xl font-semibold text-slate-950">Log in</h1>
            <p className="mt-1 text-sm text-slate-500">Access your project workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              error={errors.email}
              placeholder="you@company.com"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              error={errors.password}
              placeholder="••••••••"
            />
            <Button className="w-full" type="submit" isLoading={submitting}>
              Log in
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            New here?{" "}
            <Link className="font-medium text-slate-950 hover:underline" to="/signup">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
