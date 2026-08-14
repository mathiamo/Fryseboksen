import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Bell,
  BellRing,
  Check,
  Clock3,
  IceCreamBowl,
  ImagePlus,
  LogOut,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Snowflake,
  Trash2,
  X,
} from "lucide-react";
import { Auth } from "./components/Auth";
import {
  createItem,
  deleteItem,
  listItems,
  updateItem,
  type FreezerItem,
} from "./lib/items";
import { isConfigured, supabase } from "./lib/supabase";
import styles from "./App.module.css";

const categories = [
  ["Meals", "Ferdigretter", 90],
  ["Meat", "Kjøtt", 90],
  ["Fish", "Fisk", 90],
  ["Vegetables", "Grønnsaker", 240],
  ["Fruit", "Frukt og bær", 240],
  ["Baking", "Bakst", 90],
  ["Other", "Annet", 90],
] as const;

const durationOptions = [
  [30, "1 måned"],
  [60, "2 måneder"],
  [90, "3 måneder"],
  [120, "4 måneder"],
  [180, "6 måneder"],
  [240, "8 måneder"],
  [365, "1 år"],
] as const;

function categoryLabel(value: string) {
  return categories.find(([key]) => key === value)?.[1] ?? value;
}

function recommendedDays(value: string) {
  return categories.find(([key]) => key === value)?.[2] ?? 90;
}

function daysSince(date: string) {
  const frozenAt = new Date(`${date}T12:00:00`).getTime();
  return Math.max(0, Math.floor((Date.now() - frozenAt) / 86_400_000));
}

function itemStatus(item: FreezerItem) {
  const daysLeft = item.useWithinDays - daysSince(item.frozenOn);

  if (daysLeft < 0) {
    return { label: `${Math.abs(daysLeft)} d over tiden`, tone: "danger" };
  }
  if (daysLeft === 0) {
    return { label: "Bruk i dag", tone: "danger" };
  }
  if (daysLeft <= 14) {
    return { label: `${daysLeft} d igjen`, tone: "warning" };
  }
  return { label: "God holdbarhet", tone: "fresh" };
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (!isConfigured) {
    return (
      <main className={styles.authPage}>
        <section className={styles.authCard}>
          <h1>Oppsett mangler</h1>
          <p>Legg til Supabase-variablene beskrevet i README før appen bygges.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <Inventory
      userId={session.user.id}
      email={session.user.email ?? ""}
    />
  );
}

type InventoryProps = {
  userId: string;
  email: string;
};

function Inventory({ userId, email }: InventoryProps) {
  const [items, setItems] = useState<FreezerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FreezerItem | null>(null);
  const [error, setError] = useState("");
  const notificationsSupported = "Notification" in window;
  const [notifications, setNotifications] = useState(
    notificationsSupported && window.Notification.permission === "granted",
  );

  useEffect(() => {
    void listItems()
      .then(setItems)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Kunne ikke laste fryseren");
      })
      .finally(() => setLoading(false));
  }, []);

  const dueItems = useMemo(
    () => items.filter((item) => itemStatus(item).tone !== "fresh"),
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) =>
      `${item.name} ${categoryLabel(item.category)}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [items, query]);

  function openForm(item: FreezerItem | null = null) {
    setEditingItem(item);
    setShowForm(true);
  }

  function closeForm() {
    setEditingItem(null);
    setShowForm(false);
  }

  async function enableNotifications() {
    if (!notificationsSupported) {
      setError("Påminnelser støttes ikke i denne mobilnettleseren.");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotifications(permission === "granted");

    if (permission === "granted" && dueItems.length > 0) {
      new window.Notification("Påminnelse fra Fryseboksen", {
        body: `${dueItems.length} varer bør brukes snart.`,
      });
    }
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const form = new FormData(event.currentTarget);

      if (editingItem) {
        const updatedItem = await updateItem(form, editingItem, userId);
        setItems((current) =>
          current.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
        );
      } else {
        const newItem = await createItem(form, userId);
        setItems((current) => [newItem, ...current]);
      }

      closeForm();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kunne ikke lagre varen");
    }
  }

  async function removeItem(item: FreezerItem) {
    if (!window.confirm(`Fjerne ${item.name} fra fryseren?`)) {
      return;
    }

    try {
      await deleteItem(item);
      setItems((current) => current.filter(({ id }) => id !== item.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kunne ikke fjerne varen");
    }
  }

  return (
    <main>
      <header className={styles.topbar}>
        <a className={styles.brand} href="#top">
          <span className={styles.brandMark}>
            <Snowflake size={20} />
          </span>
          Fryseboksen
        </a>

        <div className={styles.headerActions}>
          {notificationsSupported && (
            <button className={styles.secondary} onClick={enableNotifications}>
              {notifications ? <BellRing size={17} /> : <Bell size={17} />}
              <span>Påminnelser</span>
            </button>
          )}
          <button
            className={styles.iconButton}
            onClick={() => void supabase.auth.signOut()}
            title={`Logg ut ${email}`}
            aria-label="Logg ut"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className={styles.inventory}>
        <InventoryStats items={items} dueCount={dueItems.length} />

        {dueItems.length > 0 && (
          <div className={styles.notice}>
            <Clock3 />
            <div>
              <strong>En liten påminnelse</strong>
              <p>{dueItems.length} varer begynner å bli gamle.</p>
            </div>
          </div>
        )}

        <div className={styles.inventoryHead}>
          <div>
            <span>INNHOLD</span>
            <h2>Dette har du i fryseren</h2>
          </div>
          <button className={styles.primary} onClick={() => openForm()}>
            <Plus size={18} /> Legg til
          </button>
        </div>

        <label className={styles.search}>
          <Search size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Søk i fryseren…"
          />
        </label>

        {error && <div className={styles.error}>{error}</div>}

        <InventoryContent
          loading={loading}
          items={filteredItems}
          onEdit={openForm}
          onDelete={(item) => void removeItem(item)}
        />
      </section>

      {showForm && (
        <ItemModal
          item={editingItem}
          onClose={closeForm}
          onSubmit={saveItem}
        />
      )}
    </main>
  );
}

type InventoryStatsProps = {
  items: FreezerItem[];
  dueCount: number;
};

function InventoryStats({ items, dueCount }: InventoryStatsProps) {
  const categoryCount = new Set(items.map((item) => item.category)).size;

  return (
    <div className={styles.stats}>
      <div>
        <strong>{items.length}</strong>
        <span>varer lagret</span>
      </div>
      <div>
        <strong>{dueCount}</strong>
        <span>bruk snart</span>
      </div>
      <div>
        <strong>{categoryCount}</strong>
        <span>kategorier</span>
      </div>
    </div>
  );
}

type InventoryContentProps = {
  loading: boolean;
  items: FreezerItem[];
  onEdit: (item: FreezerItem) => void;
  onDelete: (item: FreezerItem) => void;
};

function InventoryContent({
  loading,
  items,
  onEdit,
  onDelete,
}: InventoryContentProps) {
  if (loading) {
    return <div className={styles.empty}>Laster fryseren…</div>;
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <PackageOpen size={42} />
        <h3>Fryseren er klar</h3>
        <p>Legg til den første varen.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

type ItemCardProps = {
  item: FreezerItem;
  onEdit: (item: FreezerItem) => void;
  onDelete: (item: FreezerItem) => void;
};

function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const status = itemStatus(item);
  const frozenDate = new Intl.DateTimeFormat("nb-NO").format(
    new Date(`${item.frozenOn}T12:00:00`),
  );

  return (
    <article className={styles.card}>
      <div className={styles.image}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} />
        ) : (
          <IceCreamBowl size={42} />
        )}

        <span className={`${styles.status} ${styles[status.tone]}`}>
          {status.tone === "fresh" && <Check size={13} />}
          {status.label}
        </span>

        <button
          className={styles.editButton}
          onClick={() => onEdit(item)}
          aria-label={`Rediger ${item.name}`}
        >
          <Pencil size={16} />
        </button>
        <button
          className={styles.deleteButton}
          onClick={() => onDelete(item)}
          aria-label={`Fjern ${item.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className={styles.cardBody}>
        <div>
          <h3>{item.name}</h3>
          <b>×{item.quantity}</b>
        </div>
        <span>{categoryLabel(item.category)}</span>
        {item.comment && <p className={styles.comment}>{item.comment}</p>}
        <p className={styles.frozenDate}>Fryst {frozenDate}</p>
      </div>
    </article>
  );
}

type ItemModalProps = {
  item: FreezerItem | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ItemModal({ item, onClose, onSubmit }: ItemModalProps) {
  const [preview, setPreview] = useState<string | undefined>(item?.imageUrl ?? undefined);
  const [category, setCategory] = useState(item?.category ?? "Meals");
  const [useWithinDays, setUseWithinDays] = useState<number>(
    item?.useWithinDays ?? recommendedDays("Meals"),
  );

  useEffect(
    () => () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    },
    [preview],
  );

  function previewImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }

  function changeCategory(event: ChangeEvent<HTMLSelectElement>) {
    const nextCategory = event.target.value;
    setCategory(nextCategory);
    setUseWithinDays(recommendedDays(nextCategory));
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.close} onClick={onClose} aria-label="Lukk">
          <X />
        </button>
        <h2>{item ? "Rediger vare" : "Legg til i fryseren"}</h2>

        <form onSubmit={onSubmit}>
          <label className={styles.photo}>
            {preview ? (
              <img src={preview} alt="Forhåndsvisning" />
            ) : (
              <>
                <ImagePlus />
                <span>Legg til bilde</span>
                <small>Komprimeres automatisk til WebP</small>
              </>
            )}
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={previewImage}
            />
          </label>

          <label>
            Navn
            <input name="name" required maxLength={80} defaultValue={item?.name} />
          </label>

          <div className={styles.formRow}>
            <label>
              Fryst ned
              <input
                name="frozenOn"
                type="date"
                defaultValue={item?.frozenOn ?? new Date().toISOString().slice(0, 10)}
                required
              />
            </label>
            <label>
              Antall
              <input
                name="quantity"
                type="number"
                min="1"
                max="99"
                defaultValue={item?.quantity ?? 1}
                required
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Kategori
              <select name="category" value={category} onChange={changeCategory}>
                {categories.map(([value, label, days]) => (
                  <option key={value} value={value}>
                    {label} ·{" "}
                    {durationOptions.find(([optionDays]) => optionDays === days)?.[1]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Bruk innen
              <select
                name="useWithinDays"
                value={useWithinDays}
                onChange={(event) => setUseWithinDays(Number(event.target.value))}
              >
                {durationOptions.map(([days, label]) => (
                  <option key={days} value={days}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Kommentar
            <textarea
              name="comment"
              maxLength={500}
              rows={3}
              defaultValue={item?.comment}
              placeholder="For eksempel: halvfull pose"
            />
          </label>

          <button className={styles.primary}>
            {item ? "Lagre endringer" : "Legg til i fryseren"}
          </button>
        </form>
      </section>
    </div>
  );
}
