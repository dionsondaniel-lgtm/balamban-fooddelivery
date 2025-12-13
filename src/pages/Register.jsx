import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Register({ onLogin, switchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Customer");
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      alert("Phone number is required.");
      return;
    }
    if (role === "Rider" && secretCode !== "superman") {
      alert("Invalid secret code for Rider registration.");
      return;
    }

    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user || !user.id) throw new Error("No user id returned after signUp");

      const { error: insertError } = await supabase
        .from("ridercustomer_users")
        .insert([
          {
            id: user.id,
            name,
            email,
            phone,
            role,
          },
        ]);
      if (insertError) throw insertError;

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) throw loginError;
      if (!loginData.user) throw new Error("Login failed after registration");

      onLogin(loginData.user);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-300 via-pink-200 to-indigo-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <form
        onSubmit={handleRegister}
        className="p-8 w-96 rounded-2xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/40 shadow-xl flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">Register</h2>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-3 border rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-3 border rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="p-3 border rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-3 border rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="p-3 border rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="Customer">Customer</option>
          <option value="Rider">Rider</option>
        </select>

        {/* Secret code input only for Rider */}
        {role === "Rider" && (
          <input
            type="password"
            placeholder="Secret Code"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
            required
            className="p-3 border rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className={`p-3 rounded-xl text-white font-semibold text-lg bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          Already have an account?{" "}
          <button
            type="button"
            className="text-purple-600 hover:underline font-semibold"
            onClick={switchToLogin}
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
