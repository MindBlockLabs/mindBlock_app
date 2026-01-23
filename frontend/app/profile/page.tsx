import React from "react";

const ProfilePage = () => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 px-6 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Placeholder Route
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Profile</h1>
        <p className="mt-3 text-sm text-slate-400">
          This page will contain your achievements, stats, and account settings.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
