"use client";

import { FormEvent, useMemo, useState } from "react";

type IconName = "ball" | "calendar" | "map" | "plus" | "search" | "users" | "clock" | "check" | "arrow" | "menu" | "x" | "user" | "spark" | "pin";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    ball: <><circle cx="12" cy="12" r="8.5" /><path d="m12 3.5 2.7 4.1-2.7 2.2-2.7-2.2L12 3.5Zm0 6.3 3.8 2.8-1.4 4.1h-4.8l-1.4-4.1L12 9.8Z" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M7 3v4M17 3v4M3.5 9h17" /></>,
    map: <><path d="m3.5 6 5-2.5 7 3 5-2.5v14l-5 2.5-7-3-5 2.5V6Z" /><path d="M8.5 3.5v14M15.5 6.5v14" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" /></>,
    users: <><path d="M16 20v-1.4a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.6V20" /><circle cx="9.5" cy="8" r="3.2" /><path d="M21 20v-1.3a3.6 3.6 0 0 0-2.7-3.5M16.7 4.9a3.2 3.2 0 0 1 0 6.2" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></>,
    check: <path d="m5 12.5 4.2 4.2L19 7" />,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    x: <><path d="m6 6 12 12M18 6 6 18" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
    spark: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

type Match = { id: number; title: string; date: string; time: string; place: string; area: string; level: string; spots: number; total: number; price: number; host: string; joined?: boolean };

const initialMatches: Match[] = [
  { id: 1, title: "Pelada de quinta", date: "Qui, 14 nov", time: "20:00", place: "Arena Vila Madalena", area: "Vila Madalena", level: "Intermediário", spots: 4, total: 14, price: 18, host: "Rafael M." },
  { id: 2, title: "Fut7 dos amigos", date: "Sáb, 16 nov", time: "10:00", place: "Playball Pompéia", area: "Pompéia", level: "Todos os níveis", spots: 7, total: 14, price: 22, host: "Camila R." },
  { id: 3, title: "Resenha de domingo", date: "Dom, 17 nov", time: "16:30", place: "Clube Paulistano", area: "Jardins", level: "Avançado", spots: 2, total: 12, price: 25, host: "Diego A." },
  { id: 4, title: "Pelada leve", date: "Ter, 19 nov", time: "19:30", place: "Quadra Moema", area: "Moema", level: "Iniciante", spots: 9, total: 14, price: 15, host: "Bia C." },
];

const navItems = ["Início", "Encontrar peladas", "Criar pelada", "Minhas peladas", "Perfil"];

export default function JogaFacil() {
  const [active, setActive] = useState("Início");
  const [matches, setMatches] = useState(initialMatches);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("Todos");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => matches.filter((match) => {
    const text = `${match.title} ${match.place} ${match.area}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (level === "Todos" || match.level === level);
  }), [matches, query, level]);

  function goTo(item: string) {
    setActive(item);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function joinMatch(id: number) {
    setMatches((current) => current.map((match) => match.id === id && !match.joined && match.spots > 0 ? { ...match, spots: match.spots - 1, joined: true } : match));
    setNotice("Você entrou na pelada! O organizador recebeu a confirmação.");
    window.setTimeout(() => setNotice(""), 4000);
  }

  function createMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newMatch: Match = { id: Date.now(), title: String(form.get("title")), date: "Sex, 22 nov", time: String(form.get("time")), place: String(form.get("place")), area: "São Paulo", level: String(form.get("level")), spots: 13, total: 14, price: Number(form.get("price")), host: "Você" };
    setMatches((current) => [newMatch, ...current]);
    setActive("Minhas peladas");
    setNotice("Pelada criada! Agora é só compartilhar com a galera.");
    window.setTimeout(() => setNotice(""), 4000);
  }

  return <div className="jf-app">
    {notice && <div className="toast"><Icon name="check" size={17} />{notice}<button onClick={() => setNotice("")} aria-label="Fechar aviso"><Icon name="x" size={16} /></button></div>}
    <header className="jf-header">
      <div className="jf-container header-inner">
        <button className="jf-brand" onClick={() => goTo("Início")} aria-label="Ir para início"><span className="brand-ball"><Icon name="ball" size={20} /></span><span>joga<span>fácil</span></span></button>
        <nav className="desktop-nav" aria-label="Navegação principal">{navItems.map((item) => <button className={active === item ? "active" : ""} key={item} onClick={() => goTo(item)}>{item}</button>)}</nav>
        <div className="header-actions"><button className="header-user" onClick={() => goTo("Perfil")}><span className="avatar">LM</span><span className="user-name">Lucas Mendes</span></button><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu"><Icon name={menuOpen ? "x" : "menu"} /></button></div>
      </div>
      {menuOpen && <nav className="mobile-nav" aria-label="Menu mobile">{navItems.map((item) => <button className={active === item ? "active" : ""} key={item} onClick={() => goTo(item)}>{item}<Icon name="arrow" size={16} /></button>)}</nav>}
    </header>

    <main>
      {active === "Início" && <Home onNavigate={goTo} matches={filtered} onJoin={joinMatch} />}
      {active === "Encontrar peladas" && <Find matches={filtered} query={query} setQuery={setQuery} level={level} setLevel={setLevel} onJoin={joinMatch} />}
      {active === "Criar pelada" && <Create onSubmit={createMatch} />}
      {active === "Minhas peladas" && <Mine matches={matches.filter((match) => match.joined || match.host === "Você")} onNavigate={goTo} />}
      {active === "Perfil" && <Profile onNavigate={goTo} />}
    </main>
    <footer className="jf-footer"><div className="jf-container footer-grid"><div><button className="jf-brand footer-brand" onClick={() => goTo("Início")}><span className="brand-ball"><Icon name="ball" size={18} /></span><span>joga<span>fácil</span></span></button><p>Menos tempo organizando.<br />Mais tempo jogando.</p></div><div><strong>Joga Fácil</strong><button onClick={() => goTo("Encontrar peladas")}>Encontrar peladas</button><button onClick={() => goTo("Criar pelada")}>Criar uma pelada</button></div><div><strong>Ajuda</strong><button>Como funciona</button><button>Fale com a gente</button></div><div><strong>Feito para a resenha</strong><p className="footer-note"><Icon name="spark" size={16} /> Organize. Convide. Jogue.</p></div></div><div className="jf-container footer-bottom"><span>© 2024 Joga Fácil</span><span>Feito com paixão pelo futebol</span></div></footer>
  </div>;
}

function Home({ onNavigate, matches, onJoin }: { onNavigate: (item: string) => void; matches: Match[]; onJoin: (id: number) => void }) {
  return <>
    <section className="hero"><div className="hero-lines" /><div className="jf-container hero-inner"><div className="hero-copy"><div className="eyebrow"><span className="live-dot" /> A pelada da sua cidade</div><h1>Sua próxima<br /><em>pelada</em> começa aqui.</h1><p>Encontre uma partida, chame a galera e divida a quadra sem complicação.</p><div className="hero-buttons"><button className="primary-btn" onClick={() => onNavigate("Encontrar peladas")}>Encontrar uma pelada <Icon name="arrow" size={17} /></button><button className="text-btn light" onClick={() => onNavigate("Criar pelada")}>Quero organizar <Icon name="plus" size={16} /></button></div></div><div className="hero-visual" aria-hidden="true"><div className="field-card"><div className="field-circle" /><div className="field-half" /><div className="field-player p1">✦</div><div className="field-player p2">✦</div><div className="field-player p3">✦</div><div className="field-ball"><Icon name="ball" size={30} /></div><span className="field-label label-1">JOGAR</span><span className="field-label label-2">É AQUI</span></div><div className="floating-card"><span className="mini-avatar">RC</span><span><strong>Resenha de sábado</strong><small>12 jogadores confirmados</small></span><Icon name="check" size={17} /></div></div></div></section>
    <section className="how-section"><div className="jf-container"><div className="section-intro"><div><span className="section-kicker">SEM COMPLICAÇÃO</span><h2>Do convite ao campo<br /><span>em três passos.</span></h2></div><p>Você cuida da resenha.<br />A gente organiza o resto.</p></div><div className="steps"><div className="step"><span>01</span><div className="step-icon"><Icon name="map" size={22} /></div><h3>Encontre</h3><p>Veja partidas perto de você e escolha o horário que combina com a sua agenda.</p></div><div className="step"><span>02</span><div className="step-icon"><Icon name="users" size={22} /></div><h3>Entre na turma</h3><p>Confirme sua vaga, divida o valor da quadra e conheça a galera.</p></div><div className="step"><span>03</span><div className="step-icon"><Icon name="ball" size={22} /></div><h3>É só jogar</h3><p>Chegue no horário, vista a camisa e deixe a resenha acontecer.</p></div></div></div></section>
    <section className="upcoming"><div className="jf-container"><div className="section-heading"><div><span className="section-kicker">PERTO DE VOCÊ</span><h2>Tem jogo marcado.</h2></div><button className="text-btn" onClick={() => onNavigate("Encontrar peladas")}>Ver todas <Icon name="arrow" size={16} /></button></div><div className="match-grid">{matches.slice(0, 3).map((match) => <MatchCard match={match} key={match.id} onJoin={onJoin} />)}</div></div></section>
    <section className="invite-banner"><div className="jf-container invite-inner"><div><span className="section-kicker orange">PARA QUEM ORGANIZA</span><h2>Sua pelada,<br /><em>do seu jeito.</em></h2><p>Crie o jogo, defina os detalhes e deixe o Joga Fácil cuidar das confirmações.</p><button className="dark-btn" onClick={() => onNavigate("Criar pelada")}>Criar minha pelada <Icon name="arrow" size={16} /></button></div><div className="invite-stamp"><Icon name="ball" size={42} /><span>JOGA<br />FÁCIL</span></div></div></section>
  </>;
}

function MatchCard({ match, onJoin }: { match: Match; onJoin: (id: number) => void }) {
  const full = match.spots === 0;
  return <article className="match-card"><div className="match-top"><span className="match-date"><Icon name="calendar" size={15} /> {match.date}</span><span className={`level level-${match.level.split(" ")[0].toLowerCase()}`}>{match.level}</span></div><h3>{match.title}</h3><p className="match-place"><Icon name="pin" size={15} /> {match.place} <span>·</span> {match.time}</p><div className="match-footer"><div className="spots"><span className="spot-dots">{Array.from({ length: Math.min(match.total, 7) }).map((_, i) => <i className={i >= match.total - match.spots ? "open" : ""} key={i} />)}</span><span><b>{match.spots}</b> vagas restantes</span></div><div className="match-price"><small>por pessoa</small><strong>R$ {match.price}</strong></div></div><button className={`join-btn ${match.joined ? "joined" : ""}`} onClick={() => onJoin(match.id)} disabled={full || match.joined}>{match.joined ? <><Icon name="check" size={16} /> Você está dentro</> : full ? "Pelada lotada" : <>Quero jogar <Icon name="arrow" size={16} /></>}</button></article>;
}

function Find({ matches, query, setQuery, level, setLevel, onJoin }: { matches: Match[]; query: string; setQuery: (v: string) => void; level: string; setLevel: (v: string) => void; onJoin: (id: number) => void }) {
  return <section className="page-section"><div className="jf-container"><div className="page-heading"><div><span className="section-kicker">ENCONTRE SUA TURMA</span><h1>Peladas perto de você.</h1><p>Escolha um jogo e garanta sua vaga em poucos cliques.</p></div><button className="outline-btn"><Icon name="map" size={16} /> Ver no mapa</button></div><div className="filters"><label className="search-field"><Icon name="search" size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por bairro ou quadra" /></label><select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filtrar por nível"><option>Todos</option><option>Iniciante</option><option>Intermediário</option><option>Avançado</option><option>Todos os níveis</option></select><button className="filter-date"><Icon name="calendar" size={16} /> Próximos 7 dias</button></div><div className="results-meta"><span><b>{matches.length}</b> partidas encontradas</span><span>São Paulo, SP <Icon name="pin" size={14} /></span></div><div className="match-grid find-grid">{matches.length ? matches.map((match) => <MatchCard match={match} key={match.id} onJoin={onJoin} />) : <div className="empty-state"><Icon name="ball" size={30} /><h3>Nenhuma pelada encontrada</h3><p>Tente buscar por outro bairro ou nível.</p></div>}</div></div></section>;
}

function Create({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <section className="page-section create-page"><div className="jf-container narrow"><div className="page-heading"><div><span className="section-kicker">VAI ORGANIZAR?</span><h1>Crie sua pelada.</h1><p>Preencha o básico e a gente ajuda com o resto.</p></div></div><form className="create-form" onSubmit={onSubmit}><div className="form-section"><div className="form-section-title"><span>01</span><div><h2>Sobre o jogo</h2><p>Conte para a galera que tipo de partida vai rolar.</p></div></div><label>Nome da pelada<input name="title" required placeholder="Ex: Quinta do futebol" /></label><div className="form-row"><label>Data<input name="date" type="date" required /></label><label>Horário<input name="time" type="time" defaultValue="20:00" required /></label></div></div><div className="form-section"><div className="form-section-title"><span>02</span><div><h2>Onde e como</h2><p>Defina o lugar e o nível da partida.</p></div></div><label>Quadra ou endereço<input name="place" required placeholder="Ex: Arena Vila Madalena" /></label><div className="form-row"><label>Nível<select name="level" defaultValue="Todos os níveis"><option>Todos os níveis</option><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></label><label>Valor por pessoa<input name="price" type="number" min="0" defaultValue="20" required /></label></div></div><div className="form-section"><div className="form-section-title"><span>03</span><div><h2>Chame a galera</h2><p>Você poderá compartilhar o link depois de criar.</p></div></div><label>Observação <span className="optional">opcional</span><textarea name="notes" rows={3} placeholder="Ex: Cada um leva sua camisa clara ou escura" /></label></div><div className="form-actions"><button type="button" className="text-btn">Cancelar</button><button className="primary-btn" type="submit">Criar pelada <Icon name="arrow" size={17} /></button></div></form></div></section>;
}

function Mine({ matches, onNavigate }: { matches: Match[]; onNavigate: (item: string) => void }) {
  return <section className="page-section"><div className="jf-container"><div className="page-heading"><div><span className="section-kicker">SUA AGENDA</span><h1>Minhas peladas.</h1><p>Acompanhe os jogos que você organizou ou confirmou.</p></div><button className="primary-btn" onClick={() => onNavigate("Criar pelada")}><Icon name="plus" size={17} /> Criar pelada</button></div><div className="mine-tabs"><button className="active">Próximas <span>{matches.length}</span></button><button>Histórico</button></div>{matches.length ? <div className="mine-list">{matches.map((match) => <div className="mine-row" key={match.id}><div className="mine-date"><strong>{match.date.split(",")[0]}</strong><span>{match.date.split(",")[1]}</span></div><div className="mine-details"><h3>{match.title}</h3><p><Icon name="clock" size={14} /> {match.time} <span>·</span> <Icon name="pin" size={14} /> {match.place}</p></div><span className="mine-status"><Icon name="check" size={14} /> Confirmada</span><button className="more-btn">···</button></div>)}</div> : <div className="empty-state large"><Icon name="calendar" size={34} /><h3>Sua agenda está livre</h3><p>Encontre uma pelada para começar a jogar.</p><button className="primary-btn" onClick={() => onNavigate("Encontrar peladas")}>Encontrar peladas</button></div>}</div></section>;
}

function Profile({ onNavigate }: { onNavigate: (item: string) => void }) {
  return <section className="page-section"><div className="jf-container profile-layout"><div className="profile-card"><div className="profile-cover"><span className="profile-avatar">LM</span></div><div className="profile-body"><h1>Lucas Mendes</h1><p className="profile-city"><Icon name="pin" size={15} /> São Paulo, SP</p><div className="profile-stats"><div><strong>12</strong><span>peladas</span></div><div><strong>4.9</strong><span>avaliação</span></div><div><strong>8</strong><span>amigos</span></div></div><button className="outline-btn full">Editar perfil</button></div></div><div className="profile-content"><span className="section-kicker">SOBRE VOCÊ</span><h2>Gosta de jogar e conhecer gente nova.</h2><p>Seu perfil aparece para os organizadores das peladas que você participa.</p><div className="profile-callout"><Icon name="spark" size={20} /><div><strong>Complete seu perfil</strong><span>Adicione sua posição e uma foto para facilitar a resenha.</span></div><button aria-label="Completar perfil"><Icon name="arrow" size={17} /></button></div><div className="activity-title"><h2>Atividade recente</h2><button className="text-btn" onClick={() => onNavigate("Minhas peladas")}>Ver tudo <Icon name="arrow" size={15} /></button></div><div className="activity-item"><span className="activity-icon"><Icon name="ball" size={17} /></span><div><strong>Você entrou em Pelada de quinta</strong><span>Há 2 dias · Arena Vila Madalena</span></div></div><div className="activity-item"><span className="activity-icon orange-bg"><Icon name="users" size={17} /></span><div><strong>Você jogou com 11 pessoas</strong><span>Domingo passado · Playball Pompéia</span></div></div></div></div></section>;
}
