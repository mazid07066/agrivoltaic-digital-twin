import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Cloudy,
  Database,
  Home,
  Search,
  Tags,
} from "lucide-react";

import TerminologyBrowser from "@/components/terminologies/TerminologyBrowser";
import {
  terminologies,
  terminologyCategories,
} from "@/data/terminologies";

export const metadata: Metadata = {
  title: "Terminologies",
  description:
    "Searchable terminology and abbreviation reference for the Agrivoltaic Digital Twin project.",
};

export default function TerminologiesPage() {
  const contextSensitiveTerms = terminologies.filter(
    (item) => item.contextNote,
  ).length;

  return (
    <main className="terminology-page">
      <header className="terminology-topbar">
        <Link href="/" className="terminology-brand">
          <div className="terminology-brand-icon">
            <BookOpen size={20} />
          </div>

          <div>
            <strong>AgriTwin Terminologies</strong>
            <span>Agrivoltaic Digital Twin reference</span>
          </div>
        </Link>

        <nav
          className="terminology-navigation"
          aria-label="Terminology page navigation"
        >
          <Link href="/">
            <Home size={15} />
            <span>Dashboard</span>
          </Link>

          <Link href="/weather-test">
            <Cloudy size={15} />
            <span>Weather Test</span>
          </Link>

          <Link
            href="/terminologies"
            className="active"
            aria-current="page"
          >
            <BookOpen size={15} />
            <span>Terminologies</span>
          </Link>
        </nav>
      </header>

      <section className="terminology-hero">
        <div className="terminology-hero-inner">
          <div className="terminology-hero-copy">
            <div className="terminology-label">
              <BookOpen size={16} />
              Project knowledge reference
            </div>

            <h1>Terminologies and Abbreviations</h1>

            <p>
              Search the technical terms, abbreviations,
              scientific parameters, units, software
              technologies, and modelling concepts used
              throughout the Agrivoltaic Digital Twin.
            </p>
          </div>

          <div className="terminology-summary-grid">
            <SummaryCard
              icon={<Database size={19} />}
              value={terminologies.length.toString()}
              label="Recorded terms"
            />

            <SummaryCard
              icon={<Tags size={19} />}
              value={terminologyCategories.length.toString()}
              label="Technical categories"
            />

            <SummaryCard
              icon={<Search size={19} />}
              value={contextSensitiveTerms.toString()}
              label="Context-sensitive terms"
            />
          </div>
        </div>
      </section>

      <section className="terminology-content">
        <TerminologyBrowser />

        <div className="terminology-guidance">
          <p>
            <strong>Interpretation guidance:</strong>{" "}
            Some abbreviations have more than one meaning. For
            example, <b>DT</b> may refer to Digital Twin or
            Decision Tree, while <b>PID</b> may refer to a
            control method or photovoltaic degradation. The
            relevant meaning depends on the section of the
            digital twin in which the abbreviation appears.
          </p>
        </div>
      </section>
    </main>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function SummaryCard({
  icon,
  value,
  label,
}: SummaryCardProps) {
  return (
    <article className="terminology-summary-card">
      <div className="terminology-summary-icon">
        {icon}
      </div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}