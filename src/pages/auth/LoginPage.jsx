import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { login, register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccessMsg('');

    if (isSignUp) {
      const success = await register({ firstName, lastName, email, password });
      if (success) {
        setSuccessMsg('Account created successfully! Please sign in.');
        setIsSignUp(false);
        setFirstName('');
        setLastName('');
        setPassword('');
      }
    } else {
      const role = await login(email, password);
      if (role) {
        const routes = { employee: '/employee', manager: '/manager', admin: '/admin' };
        navigate(routes[role] || '/employee');
      }
    }
  };

  const quickLogin = async (type) => {
    const creds = {
      employee: { email: 'employee1@gmail.com', pass: 'Test@1234' },
      manager: { email: 'manager@gmail.com', pass: 'Test@1234' },
      admin: { email: 'admin@gmail.com', pass: 'Test@1234' },
    };
    const { email: em, pass } = creds[type];
    setEmail(em);
    setPassword(pass);
    const role = await login(em, pass);
    if (role) {
      const routes = { employee: '/employee', manager: '/manager', admin: '/admin' };
      navigate(routes[role] || '/employee');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-stone-50 via-teal-50 to-emerald-50 dark:from-[#0B1121] dark:via-[#0B1121] dark:to-[#0B1121]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2394a3b8%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40 dark:opacity-20" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center border border-teal-200 dark:border-white/20 shadow-sm shadow-teal-100/50 dark:shadow-none">
              <Target className="h-8 w-8 text-teal-700 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-br from-teal-700 to-emerald-700 dark:from-blue-400 dark:to-blue-400 bg-clip-text text-transparent">GoalTrack</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Performance Management Portal</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Drive Performance.<br />
            <span className="text-teal-700 dark:text-slate-200">Achieve Excellence.</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
            Set meaningful goals, track progress in real-time, and empower your teams with data-driven insights.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Active Users', value: '2,450+' },
              { label: 'Goals Tracked', value: '12,800+' },
              { label: 'Departments', value: '24' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-teal-950 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-teal-100/40 dark:bg-white/5 rounded-full blur-3xl dark:blur-none" />
        <div className="absolute top-20 -left-20 w-60 h-60 bg-emerald-100/40 dark:bg-white/5 rounded-full blur-3xl dark:blur-none" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-stone-50/50 via-slate-50 to-teal-50/30 dark:from-[#090E1A] dark:via-[#090E1A] dark:to-[#090E1A]">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 dark:from-[#090E1A] dark:to-[#090E1A] dark:bg-blue-600 flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 dark:from-blue-400 dark:to-blue-400 bg-clip-text text-transparent">GoalTrack</h1>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold">{isSignUp ? 'Create an account' : 'Welcome back'}</h2>
            <p className="text-[hsl(var(--color-muted-foreground))] mt-1">
              {isSignUp ? 'Sign up to get started' : 'Sign in to your account to continue'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm animate-scale-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm animate-scale-in">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4 animate-scale-in">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
                <Input
                  id="password"
                  type="password"
                  placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-[hsl(var(--color-muted-foreground))] mt-4">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); clearError(); setSuccessMsg(''); }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[hsl(var(--color-border))]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[hsl(var(--color-background))] dark:bg-[#090E1A] px-2 text-[hsl(var(--color-muted-foreground))]">Quick Demo Access</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Employee', role: 'employee', color: 'from-emerald-500 to-teal-600' },
              { label: 'Manager', role: 'manager', color: 'from-amber-500 to-orange-600' },
              { label: 'Admin', role: 'admin', color: 'from-stone-600 to-stone-800' },
            ].map((item) => (
              <button
                key={item.role}
                onClick={() => quickLogin(item.role)}
                disabled={isLoading}
                className={`relative overflow-hidden rounded-xl p-3 text-white text-sm font-medium bg-gradient-to-br ${item.color} hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-center text-[hsl(var(--color-muted-foreground))]">
            This is a demo application. Use quick access buttons or any email/password combination.
          </p>
        </div>
      </div>
    </div>
  );
}
