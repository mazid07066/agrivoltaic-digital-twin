"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Search,
  Tags,
  X,
} from "lucide-react";

import {
  terminologies,
  terminologyCategories,
  type TerminologyCategory,
} from "@/data/terminologies";

type SelectedCategory = "All" | TerminologyCategory;

export default function TerminologyBrowser() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory>("All");

  const filteredTerminologies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return terminologies
      .filter((item) => {
        const categoryMatches =
          selectedCategory === "All" ||
          item.category === selectedCategory;

        const aliases = item.aliases?.join(" ") ?? "";

        const searchMatches =
          normalizedSearch.length === 0 ||
          item.abbreviation.toLowerCase().includes(normalizedSearch) ||
          item.fullMeaning.toLowerCase().includes(normalizedSearch) ||
          item.category.toLowerCase().includes(normalizedSearch) ||
          item.description?.toLowerCase().includes(normalizedSearch) ||
          item.contextNote?.toLowerCase().includes(normalizedSearch) ||
          aliases.toLowerCase().includes(normalizedSearch);

        return categoryMatches && searchMatches;
      })
      .sort((a, b) =>
        a.abbreviation.localeCompare(b.abbreviation, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );
  }, [searchTerm, selectedCategory]);

  function resetFilters() {
    setSearchTerm("");
    setSelectedCategory("All");
  }

  const filtersAreActive =
    searchTerm.trim().length > 0 || selectedCategory !== "All";

  return (
    <section className="space-y-6">
      {/* Search and category controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <label
              htmlFor="terminology-search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Search terminology
            </label>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <input
                id="terminology-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search PV, GHI, Digital Twin, IoT..."
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />

              {searchTerm.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear terminology search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="terminology-category"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Filter by category
            </label>

            <select
              id="terminology-category"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(
                  event.target.value as SelectedCategory,
                )
              }
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="All">All categories</option>

              {terminologyCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
              <BookOpen className="h-4 w-4" />
              {filteredTerminologies.length} terminology
              {filteredTerminologies.length === 1 ? "" : "ies"} found
            </span>

            {selectedCategory !== "All" && (
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 font-medium text-sky-700">
                <Tags className="h-4 w-4" />
                {selectedCategory}
              </span>
            )}
          </div>

          {filtersAreActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Result cards */}
      {filteredTerminologies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTerminologies.map((item, index) => (
            <article
              key={`${item.category}-${item.abbreviation}-${index}`}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">
                    {item.category}
                  </p>

                  <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950">
                    {item.abbreviation}
                  </h2>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-3 text-base font-semibold leading-6 text-slate-800">
                {item.fullMeaning}
              </p>

              {item.description && (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              )}

              {item.aliases && item.aliases.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Also used:
                  </span>

                  {item.aliases.map((alias) => (
                    <span
                      key={alias}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              )}

              {item.contextNote && (
                <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

                  <p className="text-xs leading-5 text-amber-900">
                    <span className="font-bold">Context note:</span>{" "}
                    {item.contextNote}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Search className="h-6 w-6 text-slate-500" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            No terminology found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Try another abbreviation, full meaning, category, or
            project-related keyword.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Show all terminologies
          </button>
        </div>
      )}
    </section>
  );
}