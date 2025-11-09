'use client';

import { useCallback, useMemo, useState } from "react";
import styles from "./page.module.css";
import cafesData from "@/data/cafes.json";

type Cafe = {
  name: string;
  email: string;
  website?: string | null;
  source?: string | null;
};

type ProviderFilter = "all" | "business" | "public";

const PUBLIC_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "t-online.de",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "yahoo.de",
  "icloud.com",
  "me.com",
  "posteo.de",
  "protonmail.com",
  "pm.me",
  "mail.de",
  "mailbox.org",
  "freenet.de",
  "arcor.de",
  "aol.com",
  "live.com",
]);

const cafes: Cafe[] = (cafesData as Cafe[]).map((cafe) => ({
  ...cafe,
  website: cafe.website && cafe.website.trim().length > 0 ? cafe.website : null,
  source: cafe.source && cafe.source.trim().length > 0 ? cafe.source : null,
}));

const overallUniqueDomains = new Set(
  cafes.map((cafe) => cafe.email.split("@")[1].toLowerCase()),
).size;

const providerFilterLabels: Record<ProviderFilter, string> = {
  all: "All email domains",
  business: "Business domains only",
  public: "Public email providers only",
};

function isPublicEmail(email: string) {
  const domain = email.split("@")[1].toLowerCase();
  return PUBLIC_PROVIDERS.has(domain);
}

function formatDomain(email: string) {
  return email.split("@")[1].toLowerCase();
}

function sanitiseCsvField(value: string | null | undefined) {
  const safe = (value ?? "").replace(/"/g, '""');
  return `"${safe}"`;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const filteredCafes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return cafes
      .filter((cafe) => {
        if (!term) return true;
        const target = `${cafe.name} ${cafe.email} ${cafe.website ?? ""} ${
          cafe.source ?? ""
        }`.toLowerCase();
        return target.includes(term);
      })
      .filter((cafe) => {
        if (providerFilter === "all") return true;
        const publicEmail = isPublicEmail(cafe.email);
        return providerFilter === "public" ? publicEmail : !publicEmail;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [providerFilter, searchTerm]);

  const domainStats = useMemo(() => {
    const domainCount = new Map<string, number>();
    filteredCafes.forEach((cafe) => {
      const domain = formatDomain(cafe.email);
      domainCount.set(domain, (domainCount.get(domain) ?? 0) + 1);
    });

    let topDomain = "";
    let topCount = 0;
    domainCount.forEach((count, domain) => {
      if (count > topCount) {
        topDomain = domain;
        topCount = count;
      }
    });

    const publicCount = filteredCafes.filter((cafe) =>
      isPublicEmail(cafe.email),
    ).length;

    return {
      uniqueDomains: domainCount.size,
      topDomain: topCount > 0 ? `${topDomain} (${topCount})` : "—",
      publicCount,
      businessCount: filteredCafes.length - publicCount,
    };
  }, [filteredCafes]);

  const handleCopy = useCallback(async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (error) {
      console.error("Failed to copy email", error);
    }
  }, []);

  const handleDownloadCsv = useCallback(() => {
    const header = ["Name", "Email", "Website", "Source"];
    const rows = filteredCafes.map((cafe) => [
      cafe.name,
      cafe.email,
      cafe.website ?? "",
      cafe.source ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(sanitiseCsvField).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mainz-cafes.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredCafes]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.badge}>Mainz, Germany</div>
          <h1>Verified café contacts you can reach today</h1>
          <p>
            A curated list of 50 cafés in Mainz with names, email addresses, and
            reference links. Use the search and filters to narrow down who you
            want to contact, then export the results for outreach.
          </p>
          <p className={styles.meta}>
            {cafes.length} cafés · {overallUniqueDomains} unique email domains ·
            Updated {new Date().toLocaleDateString("en-GB")}
          </p>
        </header>

        <section className={styles.controls}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search by name, email, website, or source…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search cafés"
          />
          <select
            className={styles.select}
            value={providerFilter}
            onChange={(event) =>
              setProviderFilter(event.target.value as ProviderFilter)
            }
            aria-label="Filter by email domain type"
          >
            <option value="all">{providerFilterLabels.all}</option>
            <option value="business">{providerFilterLabels.business}</option>
            <option value="public">{providerFilterLabels.public}</option>
          </select>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setSearchTerm("");
                setProviderFilter("all");
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleDownloadCsv}
            >
              Download CSV
            </button>
          </div>
        </section>

        <section className={styles.statsGrid} aria-label="Summary">
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Cafés in view</span>
            <span className={styles.statPrimary}>{filteredCafes.length}</span>
            <span className={styles.statHint}>matching your filters</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Unique domains</span>
            <span className={styles.statPrimary}>
              {domainStats.uniqueDomains}
            </span>
            <span className={styles.statHint}>Top: {domainStats.topDomain}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Business emails</span>
            <span className={styles.statPrimary}>
              {domainStats.businessCount}
            </span>
            <span className={styles.statHint}>
              {domainStats.publicCount} public providers
            </span>
          </div>
        </section>

        <section className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Website</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredCafes.map((cafe) => {
                const publicProvider = isPublicEmail(cafe.email);
                const websiteLabel =
                  cafe.website && cafe.website.replace(/^https?:\/\//, "");
                const sourceIsLink =
                  cafe.source?.startsWith("http://") ||
                  cafe.source?.startsWith("https://");

                return (
                  <tr key={`${cafe.name}-${cafe.email}`}>
                    <td data-label="Name">
                      <span className={styles.cafeName}>{cafe.name}</span>
                    </td>
                    <td data-label="Email">
                      <div className={styles.emailCell}>
                        <span
                          className={
                            publicProvider
                              ? styles.emailPublic
                              : styles.emailBusiness
                          }
                        >
                          {cafe.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(cafe.email)}
                          className={styles.copyButton}
                          aria-label={`Copy email for ${cafe.name}`}
                        >
                          {copiedEmail === cafe.email ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </td>
                    <td data-label="Website">
                      {cafe.website ? (
                        <a
                          href={cafe.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {websiteLabel}
                        </a>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                    <td data-label="Source">
                      {sourceIsLink && cafe.source ? (
                        <a
                          href={cafe.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          reference
                        </a>
                      ) : (
                        <span className={styles.sourceText}>
                          {cafe.source ?? "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredCafes.length === 0 && (
            <div className={styles.emptyState}>
              <p>No cafés match your filters yet. Try adjusting the search.</p>
            </div>
          )}
        </section>

        <footer className={styles.footer}>
          <p>
            Email addresses are sourced from public café websites, imprint
            pages, and OpenStreetMap business records. Always mention your
            source and respect applicable data protection laws when contacting
            them.
          </p>
        </footer>
      </div>
    </div>
  );
}
