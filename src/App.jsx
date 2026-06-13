import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase Client ────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/*
  SUPABASE SCHEMA (run in SQL editor):

  -- Nutzer-Profile (wird automatisch nach Auth erstellt)
  create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique not null,
    created_at timestamptz default now()
  );
  create or replace function public.handle_new_user()
  returns trigger as $$
  begin
    insert into public.profiles (id, username)
    values (new.id, split_part(new.email, '@', 1));
    return new;
  end;
  $$ language plpgsql security definer;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

  -- Forum-Beiträge
  create table public.posts (
    id uuid default gen_random_uuid() primary key,
    topic_id integer not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    username text not null,
    content text not null,
    likes integer default 0,
    created_at timestamptz default now()
  );

  -- Likes (verhindert doppeltes Liken)
  create table public.likes (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references public.posts(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    unique(post_id, user_id)
  );

  -- Forum-Aufrufe
  create table public.topic_views (
    topic_id integer primary key,
    views integer default 0
  );

  -- RLS Policies
  alter table public.profiles enable row level security;
  alter table public.posts enable row level security;
  alter table public.likes enable row level security;
  alter table public.topic_views enable row level security;

  create policy "Profiles sind öffentlich lesbar" on public.profiles for select using (true);
  create policy "Posts sind öffentlich lesbar" on public.posts for select using (true);
  create policy "Authentifizierte Nutzer können posten" on public.posts for insert with check (auth.uid() = user_id);
  create policy "Likes sind öffentlich lesbar" on public.likes for select using (true);
  create policy "Authentifizierte Nutzer können liken" on public.likes for insert with check (auth.uid() = user_id);
  create policy "Authentifizierte Nutzer können unliken" on public.likes for delete using (auth.uid() = user_id);
  create policy "Topic views sind öffentlich" on public.topic_views for all using (true);

  -- Initiale View-Einträge für alle Topics
  insert into public.topic_views (topic_id, views) values (1,0),(2,0),(3,0),(4,0),(5,0)
  on conflict do nothing;
*/

// ─── Static Data ────────────────────────────────────────────────────────────
const RIGHTS = [
  { id: 1, article: "Art. 1", title: "Würde & Gleichheit", icon: "⚖️", desc: "Alle Menschen sind frei und gleich an Würde und Rechten geboren. Sie sind mit Vernunft und Gewissen begabt und sollen einander im Geist der Brüderlichkeit begegnen.", color: "#C8963E" },
  { id: 2, article: "Art. 3", title: "Recht auf Leben", icon: "🕊️", desc: "Jeder hat das Recht auf Leben, Freiheit und Sicherheit der Person.", color: "#4A90D9" },
  { id: 3, article: "Art. 5", title: "Verbot der Folter", icon: "🛡️", desc: "Niemand darf der Folter oder grausamer, unmenschlicher oder erniedrigender Behandlung oder Strafe unterworfen werden.", color: "#E05C5C" },
  { id: 4, article: "Art. 12", title: "Privatsphäre", icon: "🔒", desc: "Niemand darf willkürlichen Eingriffen in sein Privatleben, seine Familie, seine Wohnung oder seinen Schriftverkehr ausgesetzt werden.", color: "#6BAE75" },
  { id: 5, article: "Art. 18", title: "Gedanken- & Glaubensfreiheit", icon: "💭", desc: "Jeder hat das Recht auf Gedanken-, Gewissens- und Religionsfreiheit.", color: "#9B6DB5" },
  { id: 6, article: "Art. 19", title: "Meinungsfreiheit", icon: "📢", desc: "Jeder hat das Recht auf freie Meinungsäußerung; dieses Recht schließt die Freiheit ein, Meinungen unbehelligt anzuhängen.", color: "#C8963E" },
  { id: 7, article: "Art. 23", title: "Arbeit & faire Entlohnung", icon: "✊", desc: "Jeder hat das Recht auf Arbeit, auf freie Berufswahl, auf gerechte und befriedigende Arbeitsbedingungen sowie auf Schutz vor Arbeitslosigkeit.", color: "#4A90D9" },
  { id: 8, article: "Art. 26", title: "Recht auf Bildung", icon: "📚", desc: "Jeder hat das Recht auf Bildung. Die Bildung ist unentgeltlich, zum mindesten der Grundschulunterricht und die grundlegende Bildung.", color: "#6BAE75" },
];

const FORUM_TOPICS = [
  { id: 1, title: "Pressefreiheit in autoritären Staaten", category: "Meinungsfreiheit", hot: true },
  { id: 2, title: "Kinderrechte: Was können wir konkret tun?", category: "Bildung & Schutz", hot: false },
  { id: 3, title: "Klimawandel als Menschenrechtsproblem", category: "Neue Herausforderungen", hot: true },
  { id: 4, title: "Digitale Überwachung und Privatsphäre", category: "Privatsphäre", hot: false },
  { id: 5, title: "Flüchtlingsrechte an den EU-Außengrenzen", category: "Asyl & Migration", hot: true },
];

const ACTIONS = [
  { icon: "✍️", title: "Petition unterzeichnen", desc: "Aktuelle Petitionen für Menschenrechte weltweit", count: "12 aktiv", color: "#C8963E" },
  { icon: "📧", title: "Brief schreiben", desc: "Schreibe Politikern & Entscheidungsträgern", count: "Vorlagen verfügbar", color: "#4A90D9" },
  { icon: "📣", title: "Awareness teilen", desc: "Informationen in sozialen Medien verbreiten", count: "23 Kampagnen", color: "#6BAE75" },
  { icon: "🤝", title: "Organisationen unterstützen", desc: "Amnesty International, Human Rights Watch & mehr", count: "8 Partner", color: "#9B6DB5" },
];

const CATEGORY_COLORS = {
  "Meinungsfreiheit": "#C8963E",
  "Bildung & Schutz": "#6BAE75",
  "Neue Herausforderungen": "#4A90D9",
  "Privatsphäre": "#9B6DB5",
  "Asyl & Migration": "#E05C5C",
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HumanRightsHub() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedRight, setSelectedRight] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
const [activeAction, setActiveAction] = useState(null);
const [briefText, setBriefText] = useState("");
  // Auth state
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Forum state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [topicViews, setTopicViews] = useState({});
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [topicPostCounts, setTopicPostCounts] = useState({});

  // AI Chat state
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const chatEndRef = useRef(null);
  const postsEndRef = useRef(null);

  // ─── Auth Effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load post counts + views for all topics on mount
  useEffect(() => {
    loadTopicStats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    postsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts]);

  // ─── Supabase Functions ────────────────────────────────────────────────────
  const loadTopicStats = async () => {
    // Load view counts
    const { data: viewsData } = await supabase.from("topic_views").select("*");
    if (viewsData) {
      const viewMap = {};
      viewsData.forEach(v => { viewMap[v.topic_id] = v.views; });
      setTopicViews(viewMap);
    }
    // Load post counts per topic
    const { data: postsData } = await supabase.from("posts").select("topic_id");
    if (postsData) {
      const counts = {};
      postsData.forEach(p => { counts[p.topic_id] = (counts[p.topic_id] || 0) + 1; });
      setTopicPostCounts(counts);
    }
  };

  const loadPosts = async (topicId) => {
    setPostsLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true });
    setPosts(data || []);

    // Load user's likes if logged in
    if (user) {
      const { data: likesData } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);
      if (likesData) {
        setLikedPosts(new Set(likesData.map(l => l.post_id)));
      }
    }
    setPostsLoading(false);
  };

  const incrementTopicViews = async (topicId) => {
    await supabase.rpc("increment_views", { topic_id_input: topicId }).catch(() => {
      // Fallback: direct update
      supabase
        .from("topic_views")
        .upsert({ topic_id: topicId, views: (topicViews[topicId] || 0) + 1 });
    });
    setTopicViews(prev => ({ ...prev, [topicId]: (prev[topicId] || 0) + 1 }));
  };

  const submitPost = async () => {
    if (!newPostText.trim() || !user || postLoading) return;
    setPostLoading(true);
    const username = user.email.split("@")[0];
    const { data, error } = await supabase.from("posts").insert({
      topic_id: selectedTopic.id,
      author_id: user.id,
      username,
      content: newPostText.trim(),
    }).select().single();
    if (!error && data) {
      setPosts(prev => [...prev, data]);
      setTopicPostCounts(prev => ({ ...prev, [selectedTopic.id]: (prev[selectedTopic.id] || 0) + 1 }));
      setNewPostText("");
    }
    setPostLoading(false);
  };

  const toggleLike = async (post) => {
    if (!user) { setShowAuth(true); return; }
    const isLiked = likedPosts.has(post.id);
    if (isLiked) {
      // Unlike
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      await supabase.from("posts").update({ likes: Math.max(0, post.likes - 1) }).eq("id", post.id);
      setLikedPosts(prev => { const s = new Set(prev); s.delete(post.id); return s; });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
    } else {
      // Like
      const { error } = await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
      if (!error) {
        await supabase.from("posts").update({ likes: post.likes + 1 }).eq("id", post.id);
        setLikedPosts(prev => new Set([...prev, post.id]));
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p));
      }
    }
  };

  // ─── Auth Functions ────────────────────────────────────────────────────────
  const handleAuth = async () => {
    setAuthError("");
    setAuthLoading(true);
    if (authMode === "register") {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
      else { setShowAuth(false); setAuthEmail(""); setAuthPassword(""); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthError("Falsche E-Mail oder Passwort.");
      else { setShowAuth(false); setAuthEmail(""); setAuthPassword(""); }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLikedPosts(new Set());
  };

  // ─── AI Functions ──────────────────────────────────────────────────────────
  const askAI = async (question, context = "") => {
    const systemPrompt = `Du bist ein Menschenrechtsexperte und hilfst Menschen dabei, ihre Rechte zu verstehen und sich für diese einzusetzen. Antworte auf Deutsch, klar, informativ und engagiert. Beziehe dich auf die UN-Menschenrechtscharta und aktuelle Menschenrechtssituationen weltweit. Halte Antworten prägnant (max 200 Wörter). ${context}`;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || "Keine Antwort erhalten.";
  };

  const sendForumMessage = async () => {
    if (!inputMsg.trim() || aiLoading) return;
    const userMsg = { role: "user", text: inputMsg, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), name: "Du" };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg("");
    setAiLoading(true);
    try {
      const context = selectedTopic ? `Das Diskussionsthema ist: "${selectedTopic.title}" in der Kategorie "${selectedTopic.category}".` : "";
      const answer = await askAI(inputMsg, context);
      setMessages(prev => [...prev, { role: "ai", text: answer, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), name: "MR-Assistent" }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Verbindungsfehler. Bitte erneut versuchen.", time: "", name: "System" }]);
    }
    setAiLoading(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user", text: chatInput, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput("");
    setChatLoading(true);
    try {
      const context = selectedRight ? `Der Nutzer möchte mehr über ${selectedRight.article}: "${selectedRight.title}" erfahren.` : "";
      const answer = await askAI(chatInput, context);
      setChatMessages([...newHistory, { role: "ai", text: answer, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) }]);
    } catch {
      setChatMessages([...newHistory, { role: "ai", text: "Fehler bei der Verbindung.", time: "" }]);
    }
    setChatLoading(false);
  };

  const openTopic = async (topic) => {
    setSelectedTopic(topic);
    await Promise.all([loadPosts(topic.id), incrementTopicViews(topic.id)]);
    setMessages([{ role: "ai", text: `Willkommen in der Diskussion: **${topic.title}**\n\nDies ist ein wichtiges Thema im Bereich Menschenrechte. Teile deine Gedanken, Fragen oder Erfahrungen.`, time: "", name: "MR-Assistent" }]);
    setActiveTab("forum-chat");
  };

  const openRight = (right) => {
    setSelectedRight(right);
    setChatMessages([{ role: "ai", text: `Du lernst jetzt mehr über **${right.title}** (${right.article} der Allgemeinen Erklärung der Menschenrechte).\n\n"${right.desc}"\n\nWas möchtest du wissen? Ich kann dir aktuelle Verletzungen, historische Hintergründe oder konkrete Handlungsmöglichkeiten erklären.`, time: "" }]);
    setActiveTab("rights-chat");
  };

  // ─── Styles ────────────────────────────────────────────────────────────────
  const S = {
    app: { background: "#0D1B2A", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: "#E8E8E8", display: "flex", flexDirection: "column" },
    header: { background: "linear-gradient(180deg, #0A1520 0%, #0D1B2A 100%)", borderBottom: "1px solid rgba(200,150,62,0.3)", padding: "16px 20px", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { display: "flex", alignItems: "center", gap: "10px" },
    logoText: { fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px", background: "linear-gradient(135deg, #C8963E, #E8C070)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    tagline: { fontSize: "11px", color: "rgba(200,150,62,0.7)", letterSpacing: "2px", textTransform: "uppercase", marginTop: "2px" },
    nav: { display: "flex", gap: "4px", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" },
    navBtn: (active) => ({ padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: active ? "700" : "500", background: active ? "rgba(200,150,62,0.2)" : "transparent", color: active ? "#C8963E" : "rgba(255,255,255,0.5)", borderBottom: active ? "2px solid #C8963E" : "2px solid transparent", transition: "all 0.2s", whiteSpace: "nowrap" }),
    content: { flex: 1, padding: "20px", maxWidth: "800px", margin: "0 auto", width: "100%" },
    hero: { textAlign: "center", padding: "40px 20px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "32px" },
    heroQuote: { fontSize: "15px", fontStyle: "italic", color: "rgba(200,150,62,0.9)", lineHeight: "1.7", maxWidth: "500px", margin: "0 auto 16px", padding: "16px", border: "1px solid rgba(200,150,62,0.2)", borderRadius: "8px", background: "rgba(200,150,62,0.05)" },
    heroTitle: { fontSize: "32px", fontWeight: "900", lineHeight: "1.1", marginBottom: "12px", letterSpacing: "-1px" },
    heroSub: { fontSize: "15px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" },
    statsRow: { display: "flex", gap: "16px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" },
    stat: { textAlign: "center", padding: "12px 20px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" },
    statNum: { fontSize: "22px", fontWeight: "800", color: "#C8963E" },
    statLabel: { fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" },
    sectionTitle: { fontSize: "13px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(200,150,62,0.8)", marginBottom: "16px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" },
    rightCard: (color) => ({ padding: "18px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30`, cursor: "pointer", transition: "all 0.2s" }),
    rightIcon: { fontSize: "24px", marginBottom: "8px" },
    rightArticle: (color) => ({ fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", color: color, marginBottom: "4px" }),
    rightTitle: { fontSize: "15px", fontWeight: "700", marginBottom: "6px" },
    rightDesc: { fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: "1.5" },
    forumList: { display: "flex", flexDirection: "column", gap: "10px" },
    topicCard: { padding: "16px 18px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "14px" },
    topicBadge: (cat) => ({ padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", background: `${CATEGORY_COLORS[cat]}20`, color: CATEGORY_COLORS[cat], whiteSpace: "nowrap" }),
    hotBadge: { padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", background: "rgba(224,92,92,0.2)", color: "#E05C5C" },
    topicTitle: { fontSize: "14px", fontWeight: "600", marginBottom: "4px" },
    topicMeta: { fontSize: "11px", color: "rgba(255,255,255,0.35)" },
    chatContainer: { display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" },
    chatHeader: { padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px 12px 0 0", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none", display: "flex", alignItems: "center", gap: "10px" },
    chatBack: { background: "transparent", border: "none", color: "#C8963E", cursor: "pointer", fontSize: "14px", fontWeight: "700", padding: "4px 8px" },
    chatMessages: { flex: 1, overflowY: "auto", padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "12px" },
    msgName: { fontSize: "10px", fontWeight: "700", marginBottom: "4px", color: "rgba(200,150,62,0.8)", letterSpacing: "1px", textTransform: "uppercase" },
    msgTime: { fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "4px", textAlign: "right" },
    chatInput: { display: "flex", gap: "8px", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderTop: "1px solid rgba(200,150,62,0.2)", borderRadius: "0 0 12px 12px" },
    input: { flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", color: "#E8E8E8", fontSize: "13px", outline: "none" },
    sendBtn: (disabled) => ({ padding: "10px 18px", borderRadius: "8px", border: "none", background: "#C8963E", color: "#0D1B2A", fontWeight: "700", cursor: disabled ? "not-allowed" : "pointer", fontSize: "13px", opacity: disabled ? 0.5 : 1 }),
    actionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" },
    actionCard: (color) => ({ padding: "20px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${color}25`, cursor: "pointer", transition: "all 0.2s" }),
    // Auth modal
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" },
    modal: { background: "#0D1B2A", border: "1px solid rgba(200,150,62,0.3)", borderRadius: "16px", padding: "28px", width: "340px", maxWidth: "90vw" },
    modalTitle: { fontSize: "20px", fontWeight: "800", marginBottom: "20px", textAlign: "center" },
    authInput: { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "12px 14px", color: "#E8E8E8", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" },
    authBtn: { width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#C8963E", color: "#0D1B2A", fontWeight: "700", cursor: "pointer", fontSize: "14px", marginBottom: "12px" },
    authSwitch: { textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.4)" },
    authSwitchLink: { color: "#C8963E", cursor: "pointer", fontWeight: "600" },
    authError: { background: "rgba(224,92,92,0.15)", border: "1px solid rgba(224,92,92,0.3)", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#E05C5C", marginBottom: "12px" },
    userBadge: { display: "flex", alignItems: "center", gap: "8px" },
    username: { fontSize: "13px", color: "rgba(200,150,62,0.8)", fontWeight: "600" },
    logoutBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px 12px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "12px" },
    loginPrompt: { background: "rgba(200,150,62,0.08)", border: "1px solid rgba(200,150,62,0.2)", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "rgba(200,150,62,0.8)", cursor: "pointer", textAlign: "center", marginBottom: "12px" },
  };

  const msgBubbleStyle = (role) => ({
    maxWidth: "85%",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    padding: "12px 14px",
    borderRadius: role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
    background: role === "user" ? "rgba(200,150,62,0.18)" : "rgba(255,255,255,0.05)",
    border: `1px solid ${role === "user" ? "rgba(200,150,62,0.3)" : "rgba(255,255,255,0.08)"}`,
    fontSize: "13px",
    lineHeight: "1.6",
  });

  // ─── Renders ───────────────────────────────────────────────────────────────
  const renderAuthModal = () => (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && setShowAuth(false)}>
      <div style={S.modal}>
        <div style={S.modalTitle}>{authMode === "login" ? "Anmelden" : "Registrieren"}</div>
        {authError && <div style={S.authError}>{authError}</div>}
        <input style={S.authInput} type="email" placeholder="E-Mail" value={authEmail}
          onChange={e => setAuthEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuth()} />
        <input style={S.authInput} type="password" placeholder="Passwort" value={authPassword}
          onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuth()} />
        <button style={S.authBtn} onClick={handleAuth} disabled={authLoading}>
          {authLoading ? "Laden..." : authMode === "login" ? "Anmelden" : "Registrieren"}
        </button>
        <div style={S.authSwitch}>
          {authMode === "login" ? "Noch kein Konto? " : "Bereits registriert? "}
          <span style={S.authSwitchLink} onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>
            {authMode === "login" ? "Registrieren" : "Anmelden"}
          </span>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div>
      <div style={S.hero}>
        <div style={S.heroQuote}>
          „Alle Menschen sind frei und gleich an Würde und Rechten geboren."
          <div style={{ fontSize: "11px", marginTop: "8px", color: "rgba(200,150,62,0.6)" }}>— UN-Menschenrechtscharta, Artikel 1</div>
        </div>
        <h1 style={S.heroTitle}>Deine Rechte.<br />Deine Stimme.</h1>
        <p style={S.heroSub}>Informiere dich, diskutiere und handle – für Menschenrechte weltweit.</p>
        <div style={S.statsRow}>
          {[["30", "Grundrechte"], ["193", "UN-Staaten"], ["8 Mrd.", "Menschen"], ["70+", "Jahre Kampf"]].map(([n, l]) => (
            <div key={l} style={S.stat}><div style={S.statNum}>{n}</div><div style={S.statLabel}>{l}</div></div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <div style={S.sectionTitle}>🔥 Aktuelle Diskussionen</div>
        <div style={S.forumList}>
          {FORUM_TOPICS.filter(t => t.hot).map(topic => (
            <div key={topic.id} style={S.topicCard} onClick={() => openTopic(topic)}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(200,150,62,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <span style={S.topicBadge(topic.category)}>{topic.category}</span>
                  <span style={S.hotBadge}>🔥 Trending</span>
                </div>
                <div style={S.topicTitle}>{topic.title}</div>
                <div style={S.topicMeta}>👁 {topicViews[topic.id] || 0} Aufrufe</div>
              </div>
              <div style={{ textAlign: "right", minWidth: "50px" }}>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#C8963E" }}>{topicPostCounts[topic.id] || 0}</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>Beiträge</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={S.sectionTitle}>✊ Jetzt handeln</div>
        <div style={S.actionGrid}>
          {ACTIONS.slice(0, 2).map(action => (
            <div key={action.title} style={S.actionCard(action.color)}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>{action.icon}</div>
              <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "4px" }}>{action.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: "1.5", marginBottom: "8px" }}>{action.desc}</div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: action.color }}>{action.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRights = () => (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "6px" }}>Deine Grundrechte</h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>Klicke auf ein Recht, um mehr zu erfahren und Fragen zu stellen.</p>
      </div>
      <div style={S.grid}>
        {RIGHTS.map(right => (
          <div key={right.id} style={S.rightCard(right.color)} onClick={() => openRight(right)}
            onMouseEnter={e => { e.currentTarget.style.background = `${right.color}12`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "none"; }}>
            <div style={S.rightIcon}>{right.icon}</div>
            <div style={S.rightArticle(right.color)}>{right.article}</div>
            <div style={S.rightTitle}>{right.title}</div>
            <div style={S.rightDesc}>{right.desc.substring(0, 80)}…</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForum = () => (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "6px" }}>Diskussionen & Forum</h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>Tritt einer Diskussion bei – reale Beiträge von der Community.</p>
      </div>
      <div style={S.forumList}>
        {FORUM_TOPICS.map(topic => (
          <div key={topic.id} style={S.topicCard} onClick={() => openTopic(topic)}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(200,150,62,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                <span style={S.topicBadge(topic.category)}>{topic.category}</span>
                {topic.hot && <span style={S.hotBadge}>🔥</span>}
              </div>
              <div style={S.topicTitle}>{topic.title}</div>
              <div style={S.topicMeta}>
                👁 {topicViews[topic.id] || 0} Aufrufe
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: "50px" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#C8963E" }}>{topicPostCounts[topic.id] || 0}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>Beiträge</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForumChat = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 180px)" }}>
      {/* Topic Header */}
      <div style={S.chatHeader}>
        <button style={S.chatBack} onClick={() => setActiveTab("forum")}>← Zurück</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: "700" }}>{selectedTopic?.title}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
            {selectedTopic?.category} · 👁 {topicViews[selectedTopic?.id] || 0} Aufrufe
          </div>
        </div>
      </div>

      {/* Community Posts */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "14px" }}>
        {postsLoading && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Lade Beiträge…</div>}
        {!postsLoading && posts.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "13px", padding: "20px" }}>
            Noch keine Beiträge. Sei die erste Person, die schreibt!
          </div>
        )}
        {posts.map(post => (
          <div key={post.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#C8963E" }}>{post.username}</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                {new Date(post.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "10px" }}>{post.content}</div>
            <button
              onClick={() => toggleLike(post)}
              style={{ background: likedPosts.has(post.id) ? "rgba(200,150,62,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${likedPosts.has(post.id) ? "rgba(200,150,62,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: "6px", padding: "4px 10px", cursor: "pointer", color: likedPosts.has(post.id) ? "#C8963E" : "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: "600" }}
            >
              👍 {post.likes}
            </button>
          </div>
        ))}
        <div ref={postsEndRef} />
      </div>

      {/* New Post Input */}
      {user ? (
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            style={S.input}
            value={newPostText}
            onChange={e => setNewPostText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitPost()}
            placeholder="Dein Beitrag zur Diskussion…"
          />
          <button style={S.sendBtn(postLoading || !newPostText.trim())} onClick={submitPost} disabled={postLoading || !newPostText.trim()}>
            Posten
          </button>
        </div>
      ) : (
        <div style={S.loginPrompt} onClick={() => setShowAuth(true)}>
          🔐 Anmelden, um an der Diskussion teilzunehmen
        </div>
      )}

      {/* AI Assistant */}
      <div style={{ borderTop: "1px solid rgba(200,150,62,0.15)", paddingTop: "12px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "rgba(200,150,62,0.6)", marginBottom: "8px" }}>🤖 KI-Assistent befragen</div>
        <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={msgBubbleStyle(msg.role)}>
              {msg.role === "ai" && <div style={S.msgName}>{msg.name}</div>}
              <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
            </div>
          ))}
          {aiLoading && (
            <div style={msgBubbleStyle("ai")}>
              <div style={S.msgName}>MR-Assistent</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>schreibt...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input style={S.input} value={inputMsg} onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendForumMessage()}
            placeholder="Frage an den KI-Assistenten..." />
          <button style={S.sendBtn(aiLoading)} onClick={sendForumMessage} disabled={aiLoading}>Fragen</button>
        </div>
      </div>
    </div>
  );

  const renderRightsChat = () => (
    <div style={S.chatContainer}>
      <div style={S.chatHeader}>
        <button style={S.chatBack} onClick={() => setActiveTab("rights")}>← Zurück</button>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "700" }}>{selectedRight?.icon} {selectedRight?.title}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{selectedRight?.article} – UN-Menschenrechtscharta</div>
        </div>
      </div>
      <div style={S.chatMessages}>
        {chatMessages.map((msg, i) => (
          <div key={i} style={msgBubbleStyle(msg.role)}>
            {msg.role === "ai" && <div style={S.msgName}>MR-Experte</div>}
            <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
            {msg.time && <div style={S.msgTime}>{msg.time}</div>}
          </div>
        ))}
        {chatLoading && (
          <div style={msgBubbleStyle("ai")}>
            <div style={S.msgName}>MR-Experte</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>analysiert...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div style={S.chatInput}>
        <input style={S.input} value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendChatMessage()}
          placeholder="Frage stellen..." />
        <button style={S.sendBtn(chatLoading)} onClick={sendChatMessage} disabled={chatLoading}>Fragen</button>
      </div>
    </div>
  );

  const renderActions = () => {


  const briefVorlage = `Sehr geehrte Damen und Herren,

ich schreibe Ihnen als engagierter Bürger, dem die Einhaltung der Menschenrechte sehr am Herzen liegt.

[Beschreiben Sie hier Ihr konkretes Anliegen]

Die Allgemeine Erklärung der Menschenrechte der Vereinten Nationen garantiert jedem Menschen das Recht auf [relevantes Recht einfügen]. Ich bitte Sie daher dringend:

1. [Konkrete Forderung 1]
2. [Konkrete Forderung 2]
3. [Konkrete Forderung 3]

Ich erwarte Ihre Stellungnahme und verbleibe mit freundlichen Grüßen,

[Ihr Name]
[Datum]`;

  if (activeAction === "petition") {
    return (
      <div>
        <button style={S.chatBack} onClick={() => setActiveAction(null)}>← Zurück</button>
        <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "16px 0 8px" }}>✍️ Petition unterzeichnen</h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>Aktuelle Menschenrechtspetitionen auf Change.org</p>
        {[
          { title: "Pressefreiheit weltweit schützen", signatures: "124.502", url: "https://www.change.org/search?q=pressefreiheit" },
          { title: "Kinderarbeit global beenden", signatures: "89.231", url: "https://www.change.org/search?q=kinderarbeit" },
          { title: "Klimagerechtigkeit für alle", signatures: "201.445", url: "https://www.change.org/search?q=klimagerechtigkeit" },
          { title: "Flüchtlingsschutz stärken", signatures: "67.890", url: "https://www.change.org/search?q=flüchtlingsschutz" },
        ].map(p => (
          <div key={p.title} style={{ padding: "16px 18px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,150,62,0.2)", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px" }}>{p.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>✍️ {p.signatures} Unterschriften</div>
            </div>
            <a href={p.url} target="_blank" rel="noreferrer" style={{ padding: "8px 16px", borderRadius: "8px", background: "#C8963E", color: "#0D1B2A", fontWeight: "700", fontSize: "13px", textDecoration: "none" }}>
              Unterschreiben →
            </a>
          </div>
        ))}
        <a href="https://www.change.org/search?q=menschenrechte" target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", marginTop: "16px", color: "#C8963E", fontSize: "13px" }}>
          Alle Petitionen auf Change.org →
        </a>
      </div>
    );
  }

  if (activeAction === "brief") {
    return (
      <div>
        <button style={S.chatBack} onClick={() => setActiveAction(null)}>← Zurück</button>
        <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "16px 0 8px" }}>📧 Brief schreiben</h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>Vorlage für einen Brief an Politiker oder Entscheidungsträger</p>
        <textarea
          style={{ width: "100%", minHeight: "320px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,150,62,0.3)", borderRadius: "12px", padding: "16px", color: "#E8E8E8", fontSize: "13px", lineHeight: "1.7", outline: "none", resize: "vertical", boxSizing: "border-box" }}
          value={briefText || briefVorlage}
          onChange={e => setBriefText(e.target.value)}
        />
        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button onClick={() => { navigator.clipboard.writeText(briefText || briefVorlage); }}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,150,62,0.3)", background: "rgba(200,150,62,0.1)", color: "#C8963E", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>
            📋 Kopieren
          </button>
          <a href={`mailto:?subject=Menschenrechte schützen&body=${encodeURIComponent(briefText || briefVorlage)}`}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#C8963E", color: "#0D1B2A", fontWeight: "700", cursor: "pointer", fontSize: "13px", textDecoration: "none", textAlign: "center" }}>
            📧 Per E-Mail senden
          </a>
        </div>
      </div>
    );
  }

  if (activeAction === "awareness") {
    return (
      <div>
        <button style={S.chatBack} onClick={() => setActiveAction(null)}>← Zurück</button>
        <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "16px 0 8px" }}>📣 Awareness teilen</h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>So kannst du Menschenrechte in sozialen Medien sichtbar machen</p>
        {[
          { platform: "Instagram", icon: "📸", tip: "Teile Infografiken zu Menschenrechten in deiner Story. Nutze Hashtags wie #HumanRights #Menschenrechte #StandUp" },
          { platform: "Twitter / X", icon: "🐦", tip: "Tweete täglich einen Menschenrechtsartikel. Tagging von NGOs wie @amnesty oder @hrw erhöht die Reichweite." },
          { platform: "TikTok", icon: "🎵", tip: "Kurze Videos über Menschenrechtsverletzungen erreichen Millionen. Erkläre in 60 Sekunden einen Artikel der UN-Charta." },
          { platform: "WhatsApp", icon: "💬", tip: "Teile diesen Link mit Freunden und Familie: " + window.location.href },
        ].map(item => (
          <div key={item.platform} style={{ padding: "16px 18px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "10px" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "6px" }}>{item.icon} {item.platform}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: "1.6" }}>{item.tip}</div>
          </div>
        ))}
      </div>
    );
  }

  if (activeAction === "orgs") {
    return (
      <div>
        <button style={S.chatBack} onClick={() => setActiveAction(null)}>← Zurück</button>
        <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "16px 0 8px" }}>🤝 Organisationen unterstützen</h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>Diese Organisationen kämpfen täglich für Menschenrechte</p>
        {[
          { name: "Amnesty International", desc: "Weltweit führende Menschenrechtsorganisation – setzt sich für politische Gefangene ein", url: "https://www.amnesty.de", color: "#C8963E" },
          { name: "Human Rights Watch", desc: "Dokumentiert Menschenrechtsverletzungen und übt Druck auf Regierungen aus", url: "https://www.hrw.org/de", color: "#4A90D9" },
          { name: "UNHCR", desc: "UN-Flüchtlingshilfswerk – schützt Flüchtlinge und Vertriebene weltweit", url: "https://www.unhcr.org/de", color: "#6BAE75" },
          { name: "Reporter ohne Grenzen", desc: "Kämpft für Pressefreiheit und schützt Journalisten weltweit", url: "https://www.reporter-ohne-grenzen.de", color: "#9B6DB5" },
          { name: "UNICEF Deutschland", desc: "Schützt Kinderrechte und sorgt für Bildung, Gesundheit und Schutz", url: "https://www.unicef.de", color: "#E05C5C" },
        ].map(org => (
          <div key={org.name} style={{ padding: "16px 18px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${org.color}25`, marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px", color: org.color }}>{org.name}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: "1.5" }}>{org.desc}</div>
            </div>
            <a href={org.url} target="_blank" rel="noreferrer" style={{ padding: "8px 14px", borderRadius: "8px", background: `${org.color}20`, color: org.color, fontWeight: "700", fontSize: "12px", textDecoration: "none", whiteSpace: "nowrap", border: `1px solid ${org.color}30` }}>
              Besuchen →
            </a>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "6px" }}>Für Rechte kämpfen</h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>Jede Stimme zählt. Wähle, wie du aktiv werden möchtest.</p>
      </div>
      <div style={S.actionGrid}>
        {[
          { key: "petition", icon: "✍️", title: "Petition unterzeichnen", desc: "Aktuelle Petitionen für Menschenrechte weltweit", count: "Zu Change.org", color: "#C8963E" },
          { key: "brief", icon: "📧", title: "Brief schreiben", desc: "Schreibe Politikern & Entscheidungsträgern", count: "Vorlage verfügbar", color: "#4A90D9" },
          { key: "awareness", icon: "📣", title: "Awareness teilen", desc: "Anleitung für soziale Medien", count: "4 Plattformen", color: "#6BAE75" },
          { key: "orgs", icon: "🤝", title: "Organisationen unterstützen", desc: "Amnesty International, Human Rights Watch & mehr", count: "5 Partner", color: "#9B6DB5" },
        ].map(action => (
          <div key={action.key} style={{ ...S.actionCard(action.color), padding: "24px", cursor: "pointer" }}
            onClick={() => setActiveAction(action.key)}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = `${action.color}08`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{action.icon}</div>
            <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>{action.title}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: "1.5", marginBottom: "12px" }}>{action.desc}</div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: action.color }}>{action.count}</div>
            <div style={{ marginTop: "14px", padding: "10px", background: `${action.color}15`, borderRadius: "8px", border: `1px solid ${action.color}25`, textAlign: "center", fontSize: "13px", fontWeight: "700", color: action.color }}>
              Jetzt →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

  const tabs = [
    { id: "home", label: "🏠 Home" },
    { id: "rights", label: "📜 Rechte" },
    { id: "forum", label: "💬 Forum" },
    { id: "actions", label: "✊ Handeln" },
  ];

  const isChatView = activeTab === "forum-chat" || activeTab === "rights-chat";

  return (
    <div style={S.app}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,150,62,0.3); border-radius: 4px; }
      `}</style>

      {showAuth && renderAuthModal()}

      <div style={S.header}>
        <div style={S.logo}>
          <span style={{ fontSize: "28px" }}>🌍</span>
          <div>
            <div style={S.logoText}>Human Rights Hub</div>
            <div style={S.tagline}>Informieren · Diskutieren · Handeln</div>
          </div>
        </div>
        {/* Auth area */}
        <div>
          {user ? (
            <div style={S.userBadge}>
              <span style={S.username}>👤 {user.email.split("@")[0]}</span>
              <button style={S.logoutBtn} onClick={handleLogout}>Abmelden</button>
            </div>
          ) : (
            <button style={{ background: "rgba(200,150,62,0.15)", border: "1px solid rgba(200,150,62,0.3)", borderRadius: "8px", padding: "7px 14px", color: "#C8963E", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
              onClick={() => setShowAuth(true)}>
              Anmelden
            </button>
          )}
        </div>
      </div>

      {!isChatView && (
        <div style={S.nav}>
          {tabs.map(tab => (
            <button key={tab.id} style={S.navBtn(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ ...S.content, padding: isChatView ? "12px" : "20px" }}>
        {activeTab === "home" && renderHome()}
        {activeTab === "rights" && renderRights()}
        {activeTab === "forum" && renderForum()}
        {activeTab === "forum-chat" && renderForumChat()}
        {activeTab === "rights-chat" && renderRightsChat()}
        {activeTab === "actions" && renderActions()}
      </div>
    </div>
  );
}