import { createClient } from "@/lib/actions";

export default function AddClientPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in">
      <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        
        <h1 className="text-3xl font-bold mb-2">Register New Client</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Setup a new website tenant and their administrative access.
        </p>

        <form action={createClient} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Client Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Acme Corp"
                className="w-full px-4 py-2 bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="websiteUrl" className="text-sm font-medium">Website URL</label>
              <input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                required
                placeholder="https://client-site.com"
                className="w-full px-4 py-2 bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="dbUrl" className="text-sm font-medium">Database URL</label>
            <input
              id="dbUrl"
              name="dbUrl"
              type="text"
              required
              placeholder="postgresql://user:password@host:port/db"
              className="w-full px-4 py-2 bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold mb-4">Admin Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="adminEmail" className="text-sm font-medium">Admin Email</label>
                <input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  required
                  placeholder="admin@client.com"
                  className="w-full px-4 py-2 bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="adminPassword" className="text-sm font-medium">Password</label>
                <input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            Create Client Instance
          </button>
        </form>
      </div>
    </div>
  );
}
