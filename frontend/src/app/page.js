"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  const handleLaunch = () => {
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] text-gray-800 px-6">
      {/* Header Section */}
      <section className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 text-green-700">InvoiceSME</h1>
        <p className="text-lg text-gray-600">
          Smart, secure invoicing for modern small businesses.
        </p>
      </section>

      {/* Launch Button */}
      <button
        onClick={handleLaunch}
        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition-all"
      >
        Launch App
      </button>

      {/* Features Section */}
      <section className="mt-20 max-w-3xl text-center">
        <h2 className="text-2xl font-semibold mb-6 text-green-700">
          Key Features
        </h2>
        <div className="grid gap-8 sm:grid-cols-3 text-gray-700 text-sm">
          <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <h3 className="font-semibold text-green-700 mb-2">
              Smart Invoicing
            </h3>
            <p>Create, send, and manage invoices in seconds.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <h3 className="font-semibold text-green-700 mb-2">Payments</h3>
            <p>Get paid faster with integrated payment options.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <h3 className="font-semibold text-green-700 mb-2">Analytics</h3>
            <p>Track performance with clear and simple insights.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 text-sm text-gray-500">
        © {new Date().getFullYear()} InvoiceSME. All rights reserved.
      </footer>
    </main>
  );
}
