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
  const [errors, setErrors] = useState({});

  const fakeEmailDomains = ["example.com", "test.com", "sample.com"];
  const fakePhonePatterns = ["1234567890", "0000000000", "1111111111", "9999999999"];

  // --- Convert to Pascal Case without breaking typing ---
  const formatPascalCase = (str) =>
    str
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const handleNameChange = (e) => {
    const input = e.target.value;
    if (input.includes(" ")) {
      setName(formatPascalCase(input));
    } else {
      setName(input);
    }
  };

  const handleNameBlur = () => setName(formatPascalCase(name));

  const validate = () => {
    const newErrors = {};

    // Name validation
    if (!name.trim()) newErrors.name = "Full name is required.";
    else if (name.trim().split(" ").length < 2) newErrors.name = "Enter first & last name.";

    // Email validation
    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) newErrors.email = "Email is required.";
    else if (!emailRegex.test(emailTrimmed)) newErrors.email = "Invalid email format.";
    else {
      const domain = emailTrimmed.split("@")[1];
      if (fakeEmailDomains.includes(domain)) newErrors.email = "Please enter a real email address.";
    }

    // Phone validation
    const phoneDigits = phone.replace(/\D/g, "");
    if (!phoneDigits) newErrors.phone = "Phone number required.";
    else if (!/^\d{10,15}$/.test(phoneDigits)) newErrors.phone = "Phone number must be 10–15 digits.";
    else if (fakePhonePatterns.includes(phoneDigits) || /^(\d)\1{9,}$/.test(phoneDigits)) {
      newErrors.phone = "Please enter a valid real phone number.";
    }

    // Password
    if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";

    // Rider secret code
    if (role === "Rider" && secretCode !== "superman") newErrors.secretCode = "Invalid Rider secret code.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const formattedName = formatPascalCase(name.trim());
      const emailTrimmed = email.trim().toLowerCase();
      const phoneDigits = phone.replace(/\D/g, "");

      // --- Check if email or phone already exists for this role ---
      const { data: existingUsers, error: checkError } = await supabase
        .from("ridercustomer_users")
        .select("id")
        .or(`email.eq.${emailTrimmed},phone.eq.${phoneDigits}`)
        .eq("role", role);

      if (checkError) throw checkError;

      if (existingUsers.length > 0) {
        setErrors((prev) => ({
          ...prev,
          general: "Email or phone number already exists for this role.",
        }));
        setLoading(false);
        return;
      }

      // --- Proceed with Supabase Auth signUp ---
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailTrimmed,
        password,
      });
      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user || !user.id) throw new Error("Registration failed");

      // --- Insert into ridercustomer_users ---
      const { error: insertError } = await supabase.from("ridercustomer_users").insert([
        {
          id: user.id,
          name: formattedName,
          email: emailTrimmed,
          phone: phoneDigits,
          role,
        },
      ]);
      if (insertError) throw insertError;

      // --- Sign in immediately after registration ---
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });
      if (loginError) throw loginError;

      onLogin(loginData.user);
    } catch (err) {
      setErrors((prev) => ({ ...prev, general: err.message }));
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">Create Your Account</h2>

        {errors.general && <p className="text-red-500 text-sm text-center">{errors.general}</p>}

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          className={`p-3 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 ${errors.name ? "border-red-500" : ""
            }`}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`p-3 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 ${errors.email ? "border-red-500" : ""
            }`}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={`p-3 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 ${errors.phone ? "border-red-500" : ""
            }`}
        />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`p-3 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 ${errors.password ? "border-red-500" : ""
            }`}
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="p-3 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500"
        >
          <option value="Customer">Customer</option>
          <option value="Rider">Rider</option>
        </select>

        {role === "Rider" && (
          <>
            <input
              type="password"
              placeholder="Secret Code"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              className={`p-3 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 ${errors.secretCode ? "border-red-500" : ""
                }`}
            />
            {errors.secretCode && <p className="text-red-500 text-sm">{errors.secretCode}</p>}
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="p-3 mt-4 rounded-lg text-white font-semibold text-lg bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing Registration..." : "Register"}
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          Already have an account?{" "}
          <button type="button" className="text-purple-600 hover:underline font-semibold" onClick={switchToLogin}>
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
