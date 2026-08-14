"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, BellRing, Camera, Check, ChevronDown, Clock3, IceCreamBowl, ImagePlus, PackageOpen, Plus, Search, Snowflake, Trash2, X } from "lucide-react";

type FreezerItem = { id: number; name: string; frozenOn: string; useWithinDays: number; quantity: number; category: string; imageKey: string | null; createdAt: string };
const categories = [
  { value: "Meals", label: "Ferdigretter" },
  { value: "Meat", label: "Kjøtt" },
  { value: "Fish", label: "Fisk" },
  { value: "Vegetables", label: "Grønnsaker" },
  { value: "Fruit", label: "Frukt og bær" },
  { value: "Baking", label: "Bakst" },
  { value: "Other", label: "Annet" },
];
const categoryLabel = (value: string) => categories.find((category) => category.value === value)?.label ?? value;

function daysSince(date: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(`${date}T12:00:00`).getTime()) / 86_400_000));
}
function getStatus(item: FreezerItem) {
  const left = item.useWithinDays - daysSince(item.frozenOn);
  if (left < 0) return { key: "overdue", label: `${Math.abs(left)} d over tiden`, tone: "danger" };
  if (left === 0) return { key: "overdue", label: "Bruk i dag", tone: "danger" };
  if (left <= 14) return { key: "soon", label: `${left} d igjen`, tone: "warning" };
  return { key: "fresh", label: "God holdbarhet", tone: "fresh" };
}
function formatDate(date: string) {
  return new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}
function formatAge(date: string) {
  const days = daysSince(date);
  if (days === 0) return "I dag";
  if (days === 1) return "I går";
  return `${days} dager siden`;
}

export default function Home() {
  const [items, setItems] = useState<FreezerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "soon">("all");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState(() => typeof Notification !== "undefined" && Notification.permission === "granted");

  useEffect(() => {
    fetch("/api/items", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Kunne ikke laste inn fryseren din");
        const data = (await response.json()) as { items: FreezerItem[] };
        setItems(data.items);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const dueItems = useMemo(() => items.filter((item) => getStatus(item).key !== "fresh"), [items]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !normalized || item.name.toLowerCase().includes(normalized) || categoryLabel(item.category).toLowerCase().includes(normalized);
      return matchesSearch && (filter === "all" || getStatus(item).key !== "fresh");
    });
  }, [items, query, filter]);

  async function enableNotifications() {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotifications(permission === "granted");
    if (permission === "granted" && dueItems.length) new Notification("Påminnelse fra Fryseboksen", { body: `${dueItems.length} ${dueItems.length === 1 ? "vare bør" : "varer bør"} brukes snart.` });
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/items", { method: "POST", body: new FormData(event.currentTarget) });
      const data = (await response.json()) as { item?: FreezerItem; error?: string };
      if (!response.ok || !data.item) throw new Error(data.error || "Kunne ikke lagre varen");
      setItems((current) => [data.item!, ...current]); setShowForm(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Noe gikk galt"); }
    finally { setBusy(false); }
  }

  async function removeItem(item: FreezerItem) {
    if (!window.confirm(`Fjerne ${item.name} fra fryseren?`)) return;
    const response = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  return <main>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Fryseboksen forsiden"><span className="brand-mark"><Snowflake size={20} strokeWidth={2.5} /></span><span>Fryseboksen</span></a>
      <button className={`reminder-button ${notifications ? "active" : ""}`} onClick={enableNotifications}>{notifications ? <BellRing size={17} /> : <Bell size={17} />}<span>{notifications ? "Påminnelser på" : "Slå på påminnelser"}</span></button>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="eyebrow"><span /> Fryseren din – med full oversikt</span>
        <h1>Vit hva som er der.<br /><em>Bruk det i tide.</em></h1>
        <p>Registrer det du fryser ned, se hva som bør brukes snart, og kast mindre mat – uten å grave gjennom alle skuffene.</p>
        <button className="primary-button hero-add" onClick={() => setShowForm(true)}><Plus size={20} /> Legg til vare</button>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="orb orb-one" /><div className="orb orb-two" />
        <div className="freezer-card">
          <div className="freezer-top"><span><Snowflake size={18} /> FRYSER</span><span className="temperature">−18°C</span></div>
          <div className="drawer"><div className="mini-item salmon"><span>Laks</span><small>2 porsjoner</small></div><div className="mini-item berries"><span>Bær</span><small>450 g</small></div></div>
          <div className="drawer lower"><div className="mini-item soup"><span>Tomatsuppe</span><small>3 porsjoner</small></div><div className="ice-cube"><Snowflake size={24} /></div></div>
        </div>
      </div>
    </section>

    <section className="inventory">
      <div className="stats-row"><div><strong>{items.length}</strong><span>varer lagret</span></div><div><strong>{dueItems.length}</strong><span>bruk snart</span></div><div><strong>{new Set(items.map((item) => item.category)).size || 0}</strong><span>kategorier</span></div></div>
      {dueItems.length > 0 && <div className="notice"><span className="notice-icon"><Clock3 size={20} /></span><div><strong>En liten påminnelse</strong><p>{dueItems.length} {dueItems.length === 1 ? "vare begynner" : "varer begynner"} å bli gammel. Planlegg dem inn i de neste måltidene.</p></div><button onClick={() => setFilter("soon")}>Vis meg <span>→</span></button></div>}
      <div className="inventory-head"><div><span className="section-kicker">INNHOLD</span><h2>Dette har du i fryseren</h2></div><button className="primary-button compact" onClick={() => setShowForm(true)}><Plus size={18} /> Legg til</button></div>
      <div className="tools">
        <label className="search"><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Søk i fryseren..." aria-label="Søk i fryseren" /></label>
        <div className="filters" role="group" aria-label="Filtrer innholdet"><button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>Alle varer <span>{items.length}</span></button><button className={filter === "soon" ? "selected" : ""} onClick={() => setFilter("soon")}>Bruk snart <span>{dueItems.length}</span></button></div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {loading ? <div className="loading-grid">{[1,2,3].map((n) => <div className="skeleton" key={n} />)}</div> : filtered.length ? <div className="item-grid">
        {filtered.map((item) => { const status = getStatus(item); return <article className="item-card" key={item.id}>
          <div className="item-image">{item.imageKey ? <img src={`/api/images/${encodeURIComponent(item.imageKey)}`} alt={item.name} /> : <div className="image-fallback"><IceCreamBowl size={38} /></div>}<span className={`status ${status.tone}`}>{status.key === "fresh" && <Check size={13} />}{status.label}</span><button className="delete" onClick={() => removeItem(item)} aria-label={`Fjern ${item.name}`}><Trash2 size={16} /></button></div>
          <div className="item-body"><div className="item-title"><h3>{item.name}</h3><span>×{item.quantity}</span></div><p className="category">{categoryLabel(item.category)}</p><div className="item-meta"><span>Fryst {formatDate(item.frozenOn)}</span><span>{formatAge(item.frozenOn)}</span></div></div>
        </article>})}
      </div> : <div className="empty-state"><PackageOpen size={42} /><h3>{query || filter === "soon" ? "Ingen treff" : "Fryseren er klar"}</h3><p>{query || filter === "soon" ? "Prøv et annet søk, eller vis alle varer." : "Legg til den første varen, så slipper du flere mystiske bokser i fryseren."}</p>{!query && filter === "all" && <button className="primary-button" onClick={() => setShowForm(true)}><Plus size={18} /> Legg til første vare</button>}</div>}
    </section>
    <footer><span><Snowflake size={15} /> Fryseboksen</span><p>Mindre leting. Mindre matsvinn. Bedre middager.</p></footer>
    {showForm && <AddItemModal onClose={() => setShowForm(false)} onSubmit={addItem} busy={busy} />}
  </main>;
}

function AddItemModal({ onClose, onSubmit, busy }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  function previewImage(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)); }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <button className="close-button" onClick={onClose} aria-label="Lukk"><X size={21} /></button><span className="modal-icon"><Snowflake size={22} /></span><h2 id="modal-title">Legg til i fryseren</h2><p>Ta et bilde og legg inn datoen, så vet du alltid hva som er der.</p>
    <form onSubmit={onSubmit}>
      <label className={`photo-field ${preview ? "has-preview" : ""}`}>{preview ? <img src={preview} alt="Forhåndsvisning av valgt vare" /> : <><ImagePlus size={28} /><strong>Legg til bilde</strong><span>Ta et bilde eller velg fra enheten</span></>}<input type="file" name="image" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={previewImage} required />{preview && <span className="change-photo"><Camera size={15} /> Bytt bilde</span>}</label>
      <label><span>Navn på varen</span><input name="name" placeholder="For eksempel grønnsakslasagne" maxLength={80} required autoFocus /></label>
      <div className="form-row"><label><span>Fryst ned</span><input name="frozenOn" type="date" defaultValue={today} max={today} required /></label><label><span>Antall</span><input name="quantity" type="number" min="1" max="99" defaultValue="1" required /></label></div>
      <div className="form-row"><label><span>Kategori</span><span className="select-wrap"><select name="category" defaultValue="Meals">{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select><ChevronDown size={17} /></span></label><label><span>Påminn meg etter</span><span className="select-wrap"><select name="useWithinDays" defaultValue="90"><option value="30">30 dager</option><option value="60">60 dager</option><option value="90">90 dager</option><option value="180">6 måneder</option><option value="365">1 år</option></select><ChevronDown size={17} /></span></label></div>
      <button className="primary-button save-button" type="submit" disabled={busy}>{busy ? "Lagrer…" : <><Plus size={19} /> Legg til i fryseren</>}</button>
    </form>
  </div></div>;
}
