import { FormEvent, useState } from "react";
import { Snowflake } from "lucide-react";
import { supabase } from "../lib/supabase";
import styles from "../App.module.css";

export function Auth() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split("#")[0].split("?")[0] },
    });
    setMessage(error ? error.message : "Sjekk e-posten din for innloggingslenken.");
    setBusy(false);
  }
  return <main className={styles.authPage}><section className={styles.authCard}>
    <span className={styles.brandMark}><Snowflake size={24} /></span>
    <h1>Din fryser,<br /><em>alltid oppdatert.</em></h1>
    <p>Logg inn med e-post for å synkronisere varer og bilder på tvers av enheter.</p>
    <form onSubmit={signIn}><label>E-post<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="deg@eksempel.no" /></label><button disabled={busy}>{busy ? "Sender…" : "Send innloggingslenke"}</button></form>
    {message && <div className={styles.message}>{message}</div>}
  </section></main>;
}
