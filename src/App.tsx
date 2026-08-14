import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Bell, BellRing, Check, Clock3, IceCreamBowl, ImagePlus, LogOut, PackageOpen, Plus, Search, Snowflake, Trash2, X } from "lucide-react";
import { Auth } from "./components/Auth";
import { createItem, deleteItem, listItems, type FreezerItem } from "./lib/items";
import { isConfigured, supabase } from "./lib/supabase";
import styles from "./App.module.css";

const categories = [
  ["Meals", "Ferdigretter"], ["Meat", "Kjøtt"], ["Fish", "Fisk"], ["Vegetables", "Grønnsaker"],
  ["Fruit", "Frukt og bær"], ["Baking", "Bakst"], ["Other", "Annet"],
] as const;
const categoryLabel = (value: string) => categories.find(([key]) => key === value)?.[1] ?? value;
const daysSince = (date: string) => Math.max(0, Math.floor((Date.now() - new Date(`${date}T12:00:00`).getTime()) / 86_400_000));
function status(item: FreezerItem) {
  const left = item.useWithinDays - daysSince(item.frozenOn);
  if (left < 0) return { label: `${Math.abs(left)} d over tiden`, tone: "danger" };
  if (left === 0) return { label: "Bruk i dag", tone: "danger" };
  if (left <= 14) return { label: `${left} d igjen`, tone: "warning" };
  return { label: "God holdbarhet", tone: "fresh" };
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!isConfigured) return <main className={styles.authPage}><section className={styles.authCard}><h1>Oppsett mangler</h1><p>Legg til Supabase-variablene beskrevet i README før appen bygges.</p></section></main>;
  if (!session) return <Auth />;
  return <Inventory userId={session.user.id} email={session.user.email ?? ""} />;
}

function Inventory({ userId, email }: { userId: string; email: string }) {
  const [items, setItems] = useState<FreezerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState(Notification.permission === "granted");
  useEffect(() => { listItems().then(setItems).catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const due = useMemo(() => items.filter((item) => status(item).tone !== "fresh"), [items]);
  const filtered = items.filter((item) => `${item.name} ${categoryLabel(item.category)}`.toLowerCase().includes(query.trim().toLowerCase()));
  async function enableNotifications() {
    const permission = await Notification.requestPermission(); setNotifications(permission === "granted");
    if (permission === "granted" && due.length) new Notification("Påminnelse fra Fryseboksen", { body: `${due.length} varer bør brukes snart.` });
  }
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    try { const item = await createItem(new FormData(event.currentTarget), userId); setItems((current) => [item, ...current]); setShowForm(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Kunne ikke lagre varen"); }
  }
  async function remove(item: FreezerItem) {
    if (!confirm(`Fjerne ${item.name} fra fryseren?`)) return;
    try { await deleteItem(item); setItems((current) => current.filter(({ id }) => id !== item.id)); } catch (e) { setError(e instanceof Error ? e.message : "Kunne ikke fjerne varen"); }
  }
  return <main>
    <header className={styles.topbar}><a className={styles.brand} href="#top"><span className={styles.brandMark}><Snowflake size={20} /></span>Fryseboksen</a><div className={styles.headerActions}><button className={styles.secondary} onClick={enableNotifications}>{notifications ? <BellRing size={17} /> : <Bell size={17} />}<span>Påminnelser</span></button><button className={styles.iconButton} onClick={() => supabase.auth.signOut()} title={`Logg ut ${email}`}><LogOut size={18} /></button></div></header>
    <section className={styles.hero} id="top"><div><span className={styles.eyebrow}>FRYSEREN DIN – MED FULL OVERSIKT</span><h1>Vit hva som er der. <em>Bruk det i tide.</em></h1><p>Registrer det du fryser ned, se hva som bør brukes snart, og kast mindre mat.</p><button className={styles.primary} onClick={() => setShowForm(true)}><Plus size={19} /> Legg til vare</button></div></section>
    <section className={styles.inventory}>
      <div className={styles.stats}><div><strong>{items.length}</strong><span>varer lagret</span></div><div><strong>{due.length}</strong><span>bruk snart</span></div><div><strong>{new Set(items.map((item) => item.category)).size}</strong><span>kategorier</span></div></div>
      {due.length > 0 && <div className={styles.notice}><Clock3 /><div><strong>En liten påminnelse</strong><p>{due.length} varer begynner å bli gamle.</p></div></div>}
      <div className={styles.inventoryHead}><div><span>INNHOLD</span><h2>Dette har du i fryseren</h2></div><button className={styles.primary} onClick={() => setShowForm(true)}><Plus size={18} /> Legg til</button></div>
      <label className={styles.search}><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Søk i fryseren…" /></label>
      {error && <div className={styles.error}>{error}</div>}
      {loading ? <div className={styles.empty}>Laster fryseren…</div> : filtered.length ? <div className={styles.grid}>{filtered.map((item) => { const itemStatus = status(item); return <article className={styles.card} key={item.id}><div className={styles.image}>{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <IceCreamBowl size={42} />}<span className={`${styles.status} ${styles[itemStatus.tone]}`}>{itemStatus.tone === "fresh" && <Check size={13} />}{itemStatus.label}</span><button className={styles.deleteButton} onClick={() => remove(item)} aria-label={`Fjern ${item.name}`}><Trash2 size={16} /></button></div><div className={styles.cardBody}><div><h3>{item.name}</h3><b>×{item.quantity}</b></div><span>{categoryLabel(item.category)}</span><p>Fryst {new Intl.DateTimeFormat("nb-NO").format(new Date(`${item.frozenOn}T12:00:00`))}</p></div></article>; })}</div> : <div className={styles.empty}><PackageOpen size={42} /><h3>Fryseren er klar</h3><p>Legg til den første varen.</p></div>}
    </section>
    {showForm && <ItemModal onClose={() => setShowForm(false)} onSubmit={add} />}
  </main>;
}

function ItemModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [preview, setPreview] = useState<string>();
  function previewImage(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)); }
  return <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className={styles.modal} role="dialog" aria-modal="true"><button className={styles.close} onClick={onClose}><X /></button><h2>Legg til i fryseren</h2><form onSubmit={onSubmit}>
    <label className={styles.photo}>{preview ? <img src={preview} alt="Forhåndsvisning" /> : <><ImagePlus /><span>Legg til bilde</span><small>Komprimeres automatisk til WebP</small></>}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={previewImage} /></label>
    <label>Navn<input name="name" required maxLength={80} /></label><div className={styles.formRow}><label>Fryst ned<input name="frozenOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Antall<input name="quantity" type="number" min="1" max="99" defaultValue="1" required /></label></div>
    <div className={styles.formRow}><label>Kategori<select name="category">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Bruk innen<select name="useWithinDays" defaultValue="90"><option value="30">30 dager</option><option value="60">60 dager</option><option value="90">90 dager</option><option value="180">6 måneder</option><option value="365">1 år</option></select></label></div>
    <button className={styles.primary}>Legg til i fryseren</button>
  </form></section></div>;
}
