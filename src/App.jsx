import { useState, useRef, useEffect } from "react";

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
  { id: 1, title: "Pressefreiheit in autoritären Staaten", category: "Meinungsfreiheit", posts: 34, hot: true, author: "Leila M.", time: "vor 2 Std." },
  { id: 2, title: "Kinderrechte: Was können wir konkret tun?", category: "Bildung & Schutz", posts: 21, hot: false, author: "Tobias R.", time: "vor 5 Std." },
  { id: 3, title: "Klimawandel als Menschenrechtsproblem", category: "Neue Herausforderungen", posts: 58, hot: true, author: "Amina K.", time: "vor 1 Std." },
  { id: 4, title: "Digitale Überwachung und Privatsphäre", category: "Privatsphäre", posts: 17, hot: false, author: "Sven B.", time: "vor 1 Tag" },
  { id: 5, title: "Flüchtlingsrechte an den EU-Außengrenzen", category: "Asyl & Migration", posts: 89, hot: true, author: "Fatou D.", time: "vor 3 Std." },
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

export default function HumanRightsHub() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedRight, setSelectedRight] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const askAI = async (question, context = "") => {
    const systemPrompt = `Du bist ein Menschenrechtsexperte und hilfst Menschen dabei, ihre Rechte zu verstehen und sich für diese einzusetzen. Antworte auf Deutsch, klar, informativ und engagiert. Beziehe dich auf die UN-Menschenrechtscharta und aktuelle Menschenrechtssituationen weltweit. Halte Antworten prägnant (max 200 Wörter). ${context}`;
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
     headers: {
  "Content-Type": "application/json",
  "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
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
      const aiMsg = { role: "ai", text: answer, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), name: "MR-Assistent" };
      setMessages(prev => [...prev, aiMsg]);
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
      const context = selectedRight ? `Der Nutzer möchte mehr über Artikel ${selectedRight.article}: "${selectedRight.title}" erfahren.` : "Der Nutzer fragt allgemein über Menschenrechte.";
      const answer = await askAI(chatInput, context);
      setChatMessages([...newHistory, { role: "ai", text: answer, time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) }]);
    } catch {
      setChatMessages([...newHistory, { role: "ai", text: "Fehler bei der Verbindung.", time: "" }]);
    }
    setChatLoading(false);
  };

  const openTopic = (topic) => {
    setSelectedTopic(topic);
    setMessages([{ role: "ai", text: `Willkommen in der Diskussion: **${topic.title}**\n\nDies ist ein wichtiges Thema im Bereich Menschenrechte. Teile deine Gedanken, Fragen oder Erfahrungen. Ich bin hier, um zu informieren und die Diskussion zu bereichern.`, time: "", name: "MR-Assistent" }]);
    setActiveTab("forum-chat");
  };

  const openRight = (right) => {
    setSelectedRight(right);
    setChatMessages([{ role: "ai", text: `Du lernst jetzt mehr über **${right.title}** (${right.article} der Allgemeinen Erklärung der Menschenrechte).\n\n"${right.desc}"\n\nWas möchtest du wissen? Ich kann dir aktuelle Verletzungen, historische Hintergründe oder konkrete Handlungsmöglichkeiten erklären.`, time: "" }]);
    setActiveTab("rights-chat");
  };

  const styles = {
    app: { background: "#0D1B2A", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: "#E8E8E8", display: "flex", flexDirection: "column" },
    header: { background: "linear-gradient(180deg, #0A1520 0%, #0D1B2A 100%)", borderBottom: "1px solid rgba(200,150,62,0.3)", padding: "16px 20px", position: "sticky", top: 0, zIndex: 100 },
    logo: { display: "flex", alignItems: "center", gap: "10px" },
    logoIcon: { fontSize: "28px" },
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
    rightCard: (color) => ({ padding: "18px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30`, cursor: "pointer", transition: "all 0.2s", ":hover": { background: `${color}10` } }),
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
    topicPosts: { fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "right", minWidth: "50px" },
    chatContainer: { display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" },
    chatHeader: { padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px 12px 0 0", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none", display: "flex", alignItems: "center", gap: "10px" },
    chatBack: { background: "transparent", border: "none", color: "#C8963E", cursor: "pointer", fontSize: "14px", fontWeight: "700", padding: "4px 8px" },
    chatMessages: { flex: 1, overflowY: "auto", padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "12px" },
    msgBubble: (role) => ({ maxWidth: "85%", alignSelf: role === "user" ? "flex-end" : "flex-start", padding: "12px 14px", borderRadius: role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: role === "user" ? "rgba(200,150,62,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${role === "user" ? "rgba(200,150,62,0.3)" : "rgba(255,255,255,0.08)"}`, fontSize: "13px", lineHeight: "1.6" }),
    msgName: { fontSize: "10px", fontWeight: "700", marginBottom: "4px", color: "rgba(200,150,62,0.8)", letterSpacing: "1px", textTransform: "uppercase" },
    msgTime: { fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "4px", textAlign: "right" },
    chatInput: { display: "flex", gap: "8px", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderTop: "1px solid rgba(200,150,62,0.2)", borderRadius: "0 0 12px 12px" },
    input: { flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", color: "#E8E8E8", fontSize: "13px", outline: "none" },
    sendBtn: { padding: "10px 18px", borderRadius: "8px", border: "none", background: "#C8963E", color: "#0D1B2A", fontWeight: "700", cursor: "pointer", fontSize: "13px" },
    actionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" },
    actionCard: (color) => ({ padding: "20px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${color}25`, cursor: "pointer", transition: "all 0.2s" }),
    actionIcon: { fontSize: "28px", marginBottom: "10px" },
    actionTitle: { fontSize: "15px", fontWeight: "700", marginBottom: "4px" },
    actionDesc: { fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: "1.5", marginBottom: "8px" },
    actionCount: (color) => ({ fontSize: "11px", fontWeight: "700", color: color }),
    typingDot: { display: "inline-block", animation: "pulse 1s infinite" },
  };

  const renderHome = () => (
    <div>
      <div style={styles.hero}>
        <div style={styles.heroQuote}>
          „Alle Menschen sind frei und gleich an Würde und Rechten geboren."
          <div style={{ fontSize: "11px", marginTop: "8px", color: "rgba(200,150,62,0.6)" }}>— UN-Menschenrechtscharta, Artikel 1</div>
        </div>
        <h1 style={styles.heroTitle}>Deine Rechte.<br />Deine Stimme.</h1>
        <p style={styles.heroSub}>Informiere dich, diskutiere und handle – für Menschenrechte weltweit.</p>
        <div style={styles.statsRow}>
          {[["30", "Grundrechte"], ["193", "UN-Staaten"], ["8 Mrd.", "Menschen"], ["70+", "Jahre Kampf"]].map(([n, l]) => (
            <div key={l} style={styles.stat}><div style={styles.statNum}>{n}</div><div style={styles.statLabel}>{l}</div></div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <div style={styles.sectionTitle}>🔥 Aktuelle Diskussionen</div>
        <div style={styles.forumList}>
          {FORUM_TOPICS.filter(t => t.hot).slice(0, 3).map(topic => (
            <div key={topic.id} style={styles.topicCard} onClick={() => openTopic(topic)}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(200,150,62,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <span style={styles.topicBadge(topic.category)}>{topic.category}</span>
                  {topic.hot && <span style={styles.hotBadge}>🔥 Trending</span>}
                </div>
                <div style={styles.topicTitle}>{topic.title}</div>
                <div style={styles.topicMeta}>{topic.author} · {topic.time}</div>
              </div>
              <div style={styles.topicPosts}><div style={{ fontSize: "16px", fontWeight: "700", color: "#C8963E" }}>{topic.posts}</div><div style={{ fontSize: "10px" }}>Beiträge</div></div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={styles.sectionTitle}>✊ Jetzt handeln</div>
        <div style={styles.actionGrid}>
          {ACTIONS.slice(0, 2).map(action => (
            <div key={action.title} style={styles.actionCard(action.color)}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              <div style={styles.actionIcon}>{action.icon}</div>
              <div style={styles.actionTitle}>{action.title}</div>
              <div style={styles.actionDesc}>{action.desc}</div>
              <div style={styles.actionCount(action.color)}>{action.count} →</div>
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
      <div style={styles.grid}>
        {RIGHTS.map(right => (
          <div key={right.id} style={styles.rightCard(right.color)} onClick={() => openRight(right)}
            onMouseEnter={e => { e.currentTarget.style.background = `${right.color}12`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "none"; }}>
            <div style={styles.rightIcon}>{right.icon}</div>
            <div style={styles.rightArticle(right.color)}>{right.article}</div>
            <div style={styles.rightTitle}>{right.title}</div>
            <div style={styles.rightDesc}>{right.desc.substring(0, 80)}…</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForum = () => (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "6px" }}>Diskussionen & Forum</h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>Tritt einer Diskussion bei – ein KI-Assistent hilft mit Fakten & Hintergrundwissen.</p>
      </div>
      <div style={styles.forumList}>
        {FORUM_TOPICS.map(topic => (
          <div key={topic.id} style={styles.topicCard} onClick={() => openTopic(topic)}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(200,150,62,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                <span style={styles.topicBadge(topic.category)}>{topic.category}</span>
                {topic.hot && <span style={styles.hotBadge}>🔥</span>}
              </div>
              <div style={styles.topicTitle}>{topic.title}</div>
              <div style={styles.topicMeta}>{topic.author} · {topic.time}</div>
            </div>
            <div style={styles.topicPosts}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#C8963E" }}>{topic.posts}</div>
              <div style={{ fontSize: "10px" }}>Beiträge</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForumChat = () => (
    <div style={styles.chatContainer}>
      <div style={styles.chatHeader}>
        <button style={styles.chatBack} onClick={() => setActiveTab("forum")}>← Zurück</button>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "700" }}>{selectedTopic?.title}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{selectedTopic?.category}</div>
        </div>
      </div>
      <div style={styles.chatMessages}>
        {messages.map((msg, i) => (
          <div key={i} style={msgBubbleStyle(msg.role)}>
            {msg.role === "ai" && <div style={styles.msgName}>{msg.name}</div>}
            <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
            {msg.time && <div style={styles.msgTime}>{msg.time}</div>}
          </div>
        ))}
        {aiLoading && (
          <div style={msgBubbleStyle("ai")}>
            <div style={styles.msgName}>MR-Assistent</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>schreibt<span style={{ animation: "pulse 1s infinite" }}>...</span></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.chatInput}>
        <input style={styles.input} value={inputMsg} onChange={e => setInputMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendForumMessage()}
          placeholder="Dein Beitrag oder Frage..." />
        <button style={{ ...styles.sendBtn, opacity: aiLoading ? 0.5 : 1 }} onClick={sendForumMessage} disabled={aiLoading}>Senden</button>
      </div>
    </div>
  );

  const renderRightsChat = () => (
    <div style={styles.chatContainer}>
      <div style={styles.chatHeader}>
        <button style={styles.chatBack} onClick={() => setActiveTab("rights")}>← Zurück</button>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "700" }}>{selectedRight?.icon} {selectedRight?.title}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{selectedRight?.article} – UN-Menschenrechtscharta</div>
        </div>
      </div>
      <div style={styles.chatMessages}>
        {chatMessages.map((msg, i) => (
          <div key={i} style={msgBubbleStyle(msg.role)}>
            {msg.role === "ai" && <div style={styles.msgName}>MR-Experte</div>}
            <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
            {msg.time && <div style={styles.msgTime}>{msg.time}</div>}
          </div>
        ))}
        {chatLoading && (
          <div style={msgBubbleStyle("ai")}>
            <div style={styles.msgName}>MR-Experte</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>analysiert...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div style={styles.chatInput}>
        <input style={styles.input} value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendChatMessage()}
          placeholder="Frage stellen..." />
        <button style={{ ...styles.sendBtn, opacity: chatLoading ? 0.5 : 1 }} onClick={sendChatMessage} disabled={chatLoading}>Fragen</button>
      </div>
    </div>
  );

  const renderActions = () => (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "6px" }}>Für Rechte kämpfen</h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>Jede Stimme zählt. Wähle, wie du aktiv werden möchtest.</p>
      </div>
      <div style={styles.actionGrid}>
        {ACTIONS.map(action => (
          <div key={action.title} style={{ ...styles.actionCard(action.color), padding: "24px" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = `${action.color}08`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{action.icon}</div>
            <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>{action.title}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: "1.5", marginBottom: "12px" }}>{action.desc}</div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: action.color }}>{action.count}</div>
            <div style={{ marginTop: "14px", padding: "10px", background: `${action.color}15`, borderRadius: "8px", border: `1px solid ${action.color}25`, textAlign: "center", fontSize: "13px", fontWeight: "700", color: action.color, cursor: "pointer" }}>
              Jetzt →
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "28px", padding: "20px", background: "rgba(200,150,62,0.06)", border: "1px solid rgba(200,150,62,0.2)", borderRadius: "12px" }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#C8963E", marginBottom: "8px" }}>💡 Wusstest du?</div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
          Amnesty International hat seit 1961 Tausende politische Gefangene durch weltweite Briefkampagnen freigebracht. Deine Stimme hat Macht.
        </div>
      </div>
    </div>
  );

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

  const tabs = [
    { id: "home", label: "🏠 Home" },
    { id: "rights", label: "📜 Rechte" },
    { id: "forum", label: "💬 Forum" },
    { id: "actions", label: "✊ Handeln" },
  ];

  const isChatView = activeTab === "forum-chat" || activeTab === "rights-chat";

  return (
    <div style={styles.app}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} } * { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(200,150,62,0.3); border-radius: 4px; }`}</style>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌍</span>
          <div>
            <div style={styles.logoText}>Human Rights Hub</div>
            <div style={styles.tagline}>Informieren · Diskutieren · Handeln</div>
          </div>
        </div>
      </div>

      {!isChatView && (
        <div style={styles.nav}>
          {tabs.map(tab => (
            <button key={tab.id} style={styles.navBtn(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ ...styles.content, padding: isChatView ? "12px" : "20px" }}>
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
