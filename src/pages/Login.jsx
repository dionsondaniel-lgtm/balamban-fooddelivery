import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login({ onLogin, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      onLogin(data.user);
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-300 via-pink-200 to-indigo-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <form
        onSubmit={submit}
        className="p-8 w-96 rounded-2xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/40 shadow-xl flex flex-col gap-6"
      >
        <h2 className="font-bold text-2xl text-gray-900 dark:text-gray-100 text-center">
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-3 border rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-3 border rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="p-3 rounded-xl text-white font-semibold text-lg bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          No account?
          <button
            type="button"
            onClick={switchToRegister}
            className="text-purple-600 hover:underline font-semibold"
          >
            &nbsp;Register
          </button>
        </p>
      </form>
    </div>
  );
}
