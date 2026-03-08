import { useEffect, useMemo, useRef, useState } from "react";

const staffBase = {
  accoglienza: ["Domenica", "Chiara", "Paola"],
  sala: ["Diana", "Pietro", "Grazia", "Liliana", "Davide", "Saied", "Mudi"],
  runner: ["Symon", "Valeria"],
  bar: ["Enzo", "Giovanni"],
  cucina: ["Keiske", "Saranga", "Chaturi", "Jhon"],
};

const giorniSettimana = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

const defaultData = {
  manager: {
    nome: "Diana",
    ristorante: "Urubamba Napoli",
    loggedIn: false,
    logo: "",
  },
  dashboard: {
    coperti: "",
    incasso: "",
    guestplan: "",
    theFork: "",
    walkin: "",
    note: "",
    settimanaCoperti: "",
    settimanaIncasso: "",
    meseCoperti: "",
    meseIncasso: "",
  },
  turni: giorniSettimana.map((giorno) => ({
    giorno,
    accoglienza: "",
    sala: "",
    runner: "",
    bar: "",
    cucina: "",
  })),
  inventario: [
    { prodotto: "Salmone", categoria: "Pesce", scorta: "", minima: "8" },
    { prodotto: "Tonno", categoria: "Pesce", scorta: "", minima: "6" },
    { prodotto: "Ricciola", categoria: "Pesce", scorta: "", minima: "4" },
    { prodotto: "Riso sushi", categoria: "Dry", scorta: "", minima: "10" },
    { prodotto: "Lime", categoria: "Bar", scorta: "", minima: "10" },
    { prodotto: "Champagne", categoria: "Beverage", scorta: "", minima: "5" },
  ],
  ordini: [{ fornitore: "", prodotto: "", quantita: "", stato: "" }],
  beverage: {
    vinoBottiglie: "",
    cocktailVenduti: "",
    incassoVino: "",
    incassoCocktail: "",
  },
  vip: [{ nome: "", tavolo: "", preferenze: "", note: "" }],
  reportGiornaliero: {
    data: "",
    coperti: "",
    incasso: "",
    tavoloTop: "",
    criticita: "",
    azioniDomani: "",
  },
  reportSettimanale: {
    settimana: "",
    coperti: "",
    incasso: "",
    foodCost: "",
    beverageCost: "",
    note: "",
  },
};

function App() {
  const [pagina, setPagina] = useState("dashboard");
  const [data, setData] = useState(() => {
    const salvato = localStorage.getItem("urubamba-manager-v6");
    return salvato ? JSON.parse(salvato) : defaultData;
  });

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("urubamba-manager-v6", JSON.stringify(data));
  }, [data]);

  const scontrinoMedio = useMemo(() => {
    const coperti = Number(data.dashboard.coperti) || 0;
    const incasso = Number(data.dashboard.incasso) || 0;
    return coperti > 0 ? (incasso / coperti).toFixed(2) : "0.00";
  }, [data.dashboard.coperti, data.dashboard.incasso]);

  const scontrinoSettimana = useMemo(() => {
    const coperti = Number(data.dashboard.settimanaCoperti) || 0;
    const incasso = Number(data.dashboard.settimanaIncasso) || 0;
    return coperti > 0 ? (incasso / coperti).toFixed(2) : "0.00";
  }, [data.dashboard.settimanaCoperti, data.dashboard.settimanaIncasso]);

  const scontrinoMese = useMemo(() => {
    const coperti = Number(data.dashboard.meseCoperti) || 0;
    const incasso = Number(data.dashboard.meseIncasso) || 0;
    return coperti > 0 ? (incasso / coperti).toFixed(2) : "0.00";
  }, [data.dashboard.meseCoperti, data.dashboard.meseIncasso]);

  const copertiPrevisti = useMemo(() => {
    return (
      (Number(data.dashboard.guestplan) || 0) +
      (Number(data.dashboard.theFork) || 0) +
      (Number(data.dashboard.walkin) || 0)
    );
  }, [data.dashboard.guestplan, data.dashboard.theFork, data.dashboard.walkin]);

  const alertScorte = data.inventario.filter(
    (item) => item.scorta !== "" && Number(item.scorta) < Number(item.minima)
  );

  const beverageTotale =
    (Number(data.beverage.incassoVino) || 0) +
    (Number(data.beverage.incassoCocktail) || 0);

  const updateSection = (section, key, value) => {
    setData({
      ...data,
      [section]: {
        ...data[section],
        [key]: value,
      },
    });
  };

  const updateTurno = (index, key, value) => {
    const nuoviTurni = [...data.turni];
    nuoviTurni[index][key] = value;
    setData({ ...data, turni: nuoviTurni });
  };

  const updateInventario = (index, key, value) => {
    const nuovoInventario = [...data.inventario];
    nuovoInventario[index][key] = value;
    setData({ ...data, inventario: nuovoInventario });
  };

  const addInventario = () => {
    setData({
      ...data,
      inventario: [
        ...data.inventario,
        { prodotto: "", categoria: "", scorta: "", minima: "" },
      ],
    });
  };

  const updateOrdine = (index, key, value) => {
    const nuoviOrdini = [...data.ordini];
    nuoviOrdini[index][key] = value;
    setData({ ...data, ordini: nuoviOrdini });
  };

  const addOrdine = () => {
    setData({
      ...data,
      ordini: [
        ...data.ordini,
        { fornitore: "", prodotto: "", quantita: "", stato: "" },
      ],
    });
  };

  const updateVip = (index, key, value) => {
    const nuoviVip = [...data.vip];
    nuoviVip[index][key] = value;
    setData({ ...data, vip: nuoviVip });
  };

  const addVip = () => {
    setData({
      ...data,
      vip: [...data.vip, { nome: "", tavolo: "", preferenze: "", note: "" }],
    });
  };

  const resetAll = () => {
    const conferma = window.confirm("Vuoi davvero cancellare tutti i dati?");
    if (conferma) {
      setData(defaultData);
      localStorage.removeItem("urubamba-manager-v6");
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "urubamba-manager-v6.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        setData(imported);
        alert("Backup importato correttamente.");
      } catch {
        alert("File non valido.");
      }
    };
    reader.readAsText(file);
  };

  const importLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setData({
        ...data,
        manager: {
          ...data.manager,
          logo: e.target.result,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setData({
      ...data,
      manager: {
        ...data.manager,
        logo: "",
      },
    });
  };

  const printReport = () => {
    window.print();
  };

  const login = () => {
    setData({
      ...data,
      manager: {
        ...data.manager,
        loggedIn: true,
      },
    });
  };

  const logout = () => {
    setData({
      ...data,
      manager: {
        ...data.manager,
        loggedIn: false,
      },
    });
  };

  const shellStyle = {
    display: "grid",
    gridTemplateColumns: "250px 1fr",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    background: "#f7f2eb",
    color: "#1f1f1f",
  };

  const sidebarStyle = {
    background: "#171717",
    color: "white",
    padding: "24px",
  };

  const mainStyle = {
    padding: "28px",
  };

  const cardStyle = {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    border: "1px solid #ece7df",
  };

  const heroStyle = {
    background: "linear-gradient(135deg, #ffffff 0%, #f4ede4 100%)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    border: "1px solid #ece7df",
    marginBottom: "22px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid #d7d0c7",
    borderRadius: "10px",
    boxSizing: "border-box",
    background: "#fff",
  };

  const thtd = {
    border: "1px solid #e8e1d8",
    padding: "10px",
    textAlign: "left",
    verticalAlign: "top",
  };

  const menuBtn = (active) => ({
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    marginBottom: "8px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    background: active ? "#fff" : "#252525",
    color: active ? "#111" : "#fff",
    fontWeight: active ? "bold" : "normal",
  });

  const badge = {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#efe7dc",
    marginRight: "8px",
    marginTop: "8px",
    fontSize: "13px",
  };

  const kpiCard = {
    ...cardStyle,
    padding: "18px",
  };

  const maxCoperti = Math.max(
    Number(data.dashboard.coperti) || 0,
    Number(data.dashboard.settimanaCoperti) || 0,
    Number(data.dashboard.meseCoperti) || 0,
    1
  );

  const maxIncasso = Math.max(
    Number(data.dashboard.incasso) || 0,
    Number(data.dashboard.settimanaIncasso) || 0,
    Number(data.dashboard.meseIncasso) || 0,
    1
  );

  if (!data.manager.loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #f7f2eb 0%, #efe5d6 100%)",
          fontFamily: "Arial, sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            background: "white",
            padding: "30px",
            borderRadius: "24px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            border: "1px solid #ece7df",
            textAlign: "center",
          }}
        >
          {data.manager.logo ? (
            <img
              src={data.manager.logo}
              alt="Logo"
              style={{ maxWidth: "140px", maxHeight: "140px", objectFit: "contain", marginBottom: "18px" }}
            />
          ) : (
            <div
              style={{
                width: "100px",
                height: "100px",
                margin: "0 auto 18px",
                borderRadius: "20px",
                background: "#efe7dc",
                display: "grid",
                placeItems: "center",
                fontWeight: "bold",
                color: "#555",
              }}
            >
              LOGO
            </div>
          )}

          <h1 style={{ marginTop: 0 }}>Urubamba Manager</h1>
          <p style={{ color: "#666" }}>
            Accesso locale al tuo gestionale. Ordinato, elegante e pronto al servizio.
          </p>

          <div style={{ marginTop: "18px", textAlign: "left" }}>
            <label>Nome manager</label>
            <input
              value={data.manager.nome}
              onChange={(e) => updateSection("manager", "nome", e.target.value)}
              style={{ ...inputStyle, marginTop: "8px" }}
            />
          </div>

          <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
            <button
              onClick={() => logoInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: "#6b7280",
                color: "white",
                cursor: "pointer",
              }}
            >
              Carica logo
            </button>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={importLogo}
              style={{ display: "none" }}
            />
          </div>

          <div style={{ marginTop: "22px" }}>
            <button
              onClick={login}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: "#171717",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Entra nell'app
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <aside style={sidebarStyle}>
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          {data.manager.logo ? (
            <img
              src={data.manager.logo}
              alt="Logo"
              style={{
                maxWidth: "120px",
                maxHeight: "120px",
                objectFit: "contain",
                borderRadius: "16px",
                background: "white",
                padding: "8px",
              }}
            />
          ) : (
            <div
              style={{
                width: "90px",
                height: "90px",
                margin: "0 auto",
                borderRadius: "18px",
                background: "#2b2b2b",
                display: "grid",
                placeItems: "center",
                color: "#bbb",
                fontWeight: "bold",
              }}
            >
              LOGO
            </div>
          )}
        </div>

        <h2 style={{ marginTop: 0 }}>Urubamba Manager</h2>
        <p style={{ color: "#cfcfcf", fontSize: "14px" }}>
          Ciao {data.manager.nome} 👋
        </p>

        <button style={menuBtn(pagina === "dashboard")} onClick={() => setPagina("dashboard")}>
          📊 Dashboard
        </button>
        <button style={menuBtn(pagina === "staff")} onClick={() => setPagina("staff")}>
          👥 Staff
        </button>
        <button style={menuBtn(pagina === "turni")} onClick={() => setPagina("turni")}>
          📅 Turni
        </button>
        <button style={menuBtn(pagina === "inventario")} onClick={() => setPagina("inventario")}>
          📦 Inventario
        </button>
        <button style={menuBtn(pagina === "ordini")} onClick={() => setPagina("ordini")}>
          🚚 Ordini
        </button>
        <button style={menuBtn(pagina === "beverage")} onClick={() => setPagina("beverage")}>
          🍷 Beverage
        </button>
        <button style={menuBtn(pagina === "vip")} onClick={() => setPagina("vip")}>
          ⭐ Clienti VIP
        </button>
        <button style={menuBtn(pagina === "report")} onClick={() => setPagina("report")}>
          📝 Report
        </button>

        <div style={{ marginTop: "22px" }}>
          <button
            onClick={() => logoInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: "#8b5cf6",
              color: "white",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            Aggiorna logo
          </button>

          <button
            onClick={removeLogo}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: "#555",
              color: "white",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            Rimuovi logo
          </button>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={importLogo}
            style={{ display: "none" }}
          />

          <button
            onClick={exportData}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: "#2f6fed",
              color: "white",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            Esporta backup
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: "#6b7280",
              color: "white",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            Importa backup
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importData}
            style={{ display: "none" }}
          />

          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: "#444",
              color: "white",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            Esci
          </button>

          <button
            onClick={resetAll}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: "#a42828",
              color: "white",
              cursor: "pointer",
            }}
          >
            Reset dati
          </button>
        </div>

        <div style={{ marginTop: "24px", fontSize: "13px", color: "#cfcfcf" }}>
          <div>Rooftop: 30</div>
          <div>Piano 1: 30</div>
          <div>Piano 0: 6</div>
          <div>Totale: 66 coperti</div>
        </div>
      </aside>

      <main style={mainStyle}>
        {pagina === "dashboard" && (
          <>
            <div style={heroStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
                {data.manager.logo ? (
                  <img
                    src={data.manager.logo}
                    alt="Logo"
                    style={{
                      width: "82px",
                      height: "82px",
                      objectFit: "contain",
                      borderRadius: "18px",
                      background: "white",
                      padding: "8px",
                      border: "1px solid #ece7df",
                    }}
                  />
                ) : null}
                <div>
                  <h1 style={{ marginTop: 0, marginBottom: "8px" }}>Dashboard</h1>
                  <p style={{ color: "#555", marginTop: 0 }}>
                    Il centro nevralgico di Urubamba. Numeri, prenotazioni, KPI e piccoli allarmi prima che diventino tempeste.
                  </p>
                </div>
              </div>

              <div>
                <span style={badge}>Weekday: 20-30 pax</span>
                <span style={badge}>Weekend: 80-120 pax</span>
                <span style={badge}>Guestplan + TheFork</span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "18px",
                marginBottom: "20px",
              }}
            >
              <div style={kpiCard}>
                <div style={{ color: "#666", fontSize: "13px" }}>Coperti oggi</div>
                <h2>{data.dashboard.coperti || 0}</h2>
              </div>
              <div style={kpiCard}>
                <div style={{ color: "#666", fontSize: "13px" }}>Incasso oggi</div>
                <h2>€ {data.dashboard.incasso || 0}</h2>
              </div>
              <div style={kpiCard}>
                <div style={{ color: "#666", fontSize: "13px" }}>Scontrino medio</div>
                <h2>€ {scontrinoMedio}</h2>
              </div>
              <div style={kpiCard}>
                <div style={{ color: "#666", fontSize: "13px" }}>Coperti previsti</div>
                <h2>{copertiPrevisti}</h2>
              </div>
              <div style={kpiCard}>
                <div style={{ color: "#666", fontSize: "13px" }}>Totale beverage</div>
                <h2>€ {beverageTotale}</h2>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "18px",
                marginBottom: "20px",
              }}
            >
              <div style={cardStyle}>
                <h3>Coperti oggi</h3>
                <input
                  type="number"
                  value={data.dashboard.coperti}
                  onChange={(e) => updateSection("dashboard", "coperti", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={cardStyle}>
                <h3>Incasso oggi €</h3>
                <input
                  type="number"
                  value={data.dashboard.incasso}
                  onChange={(e) => updateSection("dashboard", "incasso", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={cardStyle}>
                <h3>Coperti settimana</h3>
                <input
                  type="number"
                  value={data.dashboard.settimanaCoperti}
                  onChange={(e) => updateSection("dashboard", "settimanaCoperti", e.target.value)}
                  style={inputStyle}
                />
                <div style={{ marginTop: "10px", color: "#666" }}>
                  Scontrino: <strong>{scontrinoSettimana} €</strong>
                </div>
              </div>

              <div style={cardStyle}>
                <h3>Incasso settimana €</h3>
                <input
                  type="number"
                  value={data.dashboard.settimanaIncasso}
                  onChange={(e) => updateSection("dashboard", "settimanaIncasso", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ ...cardStyle, marginBottom: "20px" }}>
              <h2>Prenotazioni</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
                <div>
                  <label>Guestplan</label>
                  <input
                    type="number"
                    value={data.dashboard.guestplan}
                    onChange={(e) => updateSection("dashboard", "guestplan", e.target.value)}
                    style={{ ...inputStyle, marginTop: "8px" }}
                  />
                </div>
                <div>
                  <label>TheFork</label>
                  <input
                    type="number"
                    value={data.dashboard.theFork}
                    onChange={(e) => updateSection("dashboard", "theFork", e.target.value)}
                    style={{ ...inputStyle, marginTop: "8px" }}
                  />
                </div>
                <div>
                  <label>Walk-in</label>
                  <input
                    type="number"
                    value={data.dashboard.walkin}
                    onChange={(e) => updateSection("dashboard", "walkin", e.target.value)}
                    style={{ ...inputStyle, marginTop: "8px" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={cardStyle}>
                <h2>Grafico coperti</h2>
                <div style={{ display: "flex", alignItems: "end", gap: "18px", height: "220px", marginTop: "20px" }}>
                  {[
                    { label: "Oggi", value: Number(data.dashboard.coperti) || 0 },
                    { label: "Settimana", value: Number(data.dashboard.settimanaCoperti) || 0 },
                    { label: "Mese", value: Number(data.dashboard.meseCoperti) || 0 },
                  ].map((item) => (
                    <div key={item.label} style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          height: `${(item.value / maxCoperti) * 180}px`,
                          background: "#2f6fed",
                          borderRadius: "10px 10px 0 0",
                          minHeight: item.value > 0 ? "8px" : "0px",
                        }}
                      />
                      <div style={{ marginTop: "10px", fontWeight: "bold" }}>{item.value}</div>
                      <div style={{ color: "#666" }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h2>Grafico incassi</h2>
                <div style={{ display: "flex", alignItems: "end", gap: "18px", height: "220px", marginTop: "20px" }}>
                  {[
                    { label: "Oggi", value: Number(data.dashboard.incasso) || 0 },
                    { label: "Settimana", value: Number(data.dashboard.settimanaIncasso) || 0 },
                    { label: "Mese", value: Number(data.dashboard.meseIncasso) || 0 },
                  ].map((item) => (
                    <div key={item.label} style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          height: `${(item.value / maxIncasso) * 180}px`,
                          background: "#1ea672",
                          borderRadius: "10px 10px 0 0",
                          minHeight: item.value > 0 ? "8px" : "0px",
                        }}
                      />
                      <div style={{ marginTop: "10px", fontWeight: "bold" }}>€ {item.value}</div>
                      <div style={{ color: "#666" }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ ...cardStyle, marginTop: "20px" }}>
              <h2>Alert Scorte</h2>
              {alertScorte.length === 0 ? (
                <p>Nessun prodotto sotto soglia.</p>
              ) : (
                <ul>
                  {alertScorte.map((item, i) => (
                    <li key={i}>
                      {item.prodotto} | Scorta: {item.scorta} | Minima: {item.minima}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ ...cardStyle, marginTop: "20px" }}>
              <h2>Note Manager</h2>
              <textarea
                value={data.dashboard.note}
                onChange={(e) => updateSection("dashboard", "note", e.target.value)}
                style={{ ...inputStyle, height: "140px" }}
              />
            </div>
          </>
        )}

        {pagina === "staff" && (
          <>
            <h1 style={{ marginTop: 0 }}>Staff Urubamba</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
              {Object.entries(staffBase).map(([area, nomi]) => (
                <div key={area} style={cardStyle}>
                  <h2 style={{ textTransform: "capitalize" }}>{area}</h2>
                  <ul>
                    {nomi.map((nome) => (
                      <li key={nome}>{nome}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {pagina === "turni" && (
          <>
            <h1 style={{ marginTop: 0 }}>Turni Staff</h1>
            <div style={cardStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thtd}>Giorno</th>
                    <th style={thtd}>Accoglienza</th>
                    <th style={thtd}>Sala</th>
                    <th style={thtd}>Runner</th>
                    <th style={thtd}>Bar</th>
                    <th style={thtd}>Cucina</th>
                  </tr>
                </thead>
                <tbody>
                  {data.turni.map((turno, index) => (
                    <tr key={turno.giorno}>
                      <td style={thtd}>{turno.giorno}</td>
                      <td style={thtd}><input value={turno.accoglienza} onChange={(e) => updateTurno(index, "accoglienza", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input value={turno.sala} onChange={(e) => updateTurno(index, "sala", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input value={turno.runner} onChange={(e) => updateTurno(index, "runner", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input value={turno.bar} onChange={(e) => updateTurno(index, "bar", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input value={turno.cucina} onChange={(e) => updateTurno(index, "cucina", e.target.value)} style={inputStyle} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagina === "inventario" && (
          <>
            <h1 style={{ marginTop: 0 }}>Inventario</h1>
            <div style={cardStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thtd}>Prodotto</th>
                    <th style={thtd}>Categoria</th>
                    <th style={thtd}>Scorta</th>
                    <th style={thtd}>Minima</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventario.map((item, index) => (
                    <tr key={index}>
                      <td style={thtd}><input value={item.prodotto} onChange={(e) => updateInventario(index, "prodotto", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input value={item.categoria} onChange={(e) => updateInventario(index, "categoria", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input type="number" value={item.scorta} onChange={(e) => updateInventario(index, "scorta", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input type="number" value={item.minima} onChange={(e) => updateInventario(index, "minima", e.target.value)} style={inputStyle} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={addInventario}
                style={{
                  marginTop: "16px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#222",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                + Aggiungi prodotto
              </button>
            </div>
          </>
        )}

        {pagina === "ordini" && (
          <>
            <h1 style={{ marginTop: 0 }}>Ordini Fornitori</h1>
            <div style={cardStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thtd}>Fornitore</th>
                    <th style={thtd}>Prodotto</th>
                    <th style={thtd}>Quantità</th>
                    <th style={thtd}>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ordini.map((ordine, index) => (
                    <tr key={index}>
                      <td style={thtd}><input value={ordine.fornitore} onChange={(e) => updateOrdine(index, "fornitore", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input value={ordine.prodotto} onChange={(e) => updateOrdine(index, "prodotto", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input type="number" value={ordine.quantita} onChange={(e) => updateOrdine(index, "quantita", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input value={ordine.stato} onChange={(e) => updateOrdine(index, "stato", e.target.value)} style={inputStyle} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={addOrdine}
                style={{
                  marginTop: "16px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#222",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                + Aggiungi ordine
              </button>
            </div>
          </>
        )}

        {pagina === "beverage" && (
          <>
            <h1 style={{ marginTop: 0 }}>Beverage Control</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
              <div style={cardStyle}>
                <h3>Bottiglie vino vendute</h3>
                <input type="number" value={data.beverage.vinoBottiglie} onChange={(e) => updateSection("beverage", "vinoBottiglie", e.target.value)} style={inputStyle} />
              </div>
              <div style={cardStyle}>
                <h3>Cocktail venduti</h3>
                <input type="number" value={data.beverage.cocktailVenduti} onChange={(e) => updateSection("beverage", "cocktailVenduti", e.target.value)} style={inputStyle} />
              </div>
              <div style={cardStyle}>
                <h3>Incasso vino €</h3>
                <input type="number" value={data.beverage.incassoVino} onChange={(e) => updateSection("beverage", "incassoVino", e.target.value)} style={inputStyle} />
              </div>
              <div style={cardStyle}>
                <h3>Incasso cocktail €</h3>
                <input type="number" value={data.beverage.incassoCocktail} onChange={(e) => updateSection("beverage", "incassoCocktail", e.target.value)} style={inputStyle} />
              </div>
              <div style={{ ...cardStyle, gridColumn: "1 / span 2" }}>
                <h3>Totale beverage</h3>
                <h2>€ {beverageTotale}</h2>
              </div>
            </div>
          </>
        )}

        {pagina === "vip" && (
          <>
            <h1 style={{ marginTop: 0 }}>Clienti VIP</h1>
            <div style={cardStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thtd}>Nome</th>
                    <th style={thtd}>Tavolo</th>
                    <th style={thtd}>Preferenze</th>
                    <th style={thtd}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vip.map((cliente, index) => (
                    <tr key={index}>
                      <td style={thtd}><input value={cliente.nome} onChange={(e) => updateVip(index, "nome", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input value={cliente.tavolo} onChange={(e) => updateVip(index, "tavolo", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input value={cliente.preferenze} onChange={(e) => updateVip(index, "preferenze", e.target.value)} style={inputStyle} /></td>
                      <td style={thtd}><input value={cliente.note} onChange={(e) => updateVip(index, "note", e.target.value)} style={inputStyle} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={addVip}
                style={{
                  marginTop: "16px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#222",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                + Aggiungi cliente VIP
              </button>
            </div>
          </>
        )}

        {pagina === "report" && (
          <>
            <div style={heroStyle}>
              <h1 style={{ marginTop: 0, marginBottom: "8px" }}>Report</h1>
              <p style={{ color: "#555", marginTop: 0 }}>
                Diario di bordo del servizio. Qui la serata lascia impronte invece di svanire nel rumore della chiusura.
              </p>
              <button
                onClick={printReport}
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#171717",
                  color: "white",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Stampa report
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={cardStyle}>
                <h2>Report giornaliero</h2>
                <div style={{ display: "grid", gap: "12px" }}>
                  <input placeholder="Data" value={data.reportGiornaliero.data} onChange={(e) => updateSection("reportGiornaliero", "data", e.target.value)} style={inputStyle} />
                  <input placeholder="Coperti" value={data.reportGiornaliero.coperti} onChange={(e) => updateSection("reportGiornaliero", "coperti", e.target.value)} style={inputStyle} />
                  <input placeholder="Incasso €" value={data.reportGiornaliero.incasso} onChange={(e) => updateSection("reportGiornaliero", "incasso", e.target.value)} style={inputStyle} />
                  <input placeholder="Tavolo top / cliente top" value={data.reportGiornaliero.tavoloTop} onChange={(e) => updateSection("reportGiornaliero", "tavoloTop", e.target.value)} style={inputStyle} />
                  <textarea placeholder="Criticità del servizio" value={data.reportGiornaliero.criticita} onChange={(e) => updateSection("reportGiornaliero", "criticita", e.target.value)} style={{ ...inputStyle, height: "100px" }} />
                  <textarea placeholder="Azioni per domani" value={data.reportGiornaliero.azioniDomani} onChange={(e) => updateSection("reportGiornaliero", "azioniDomani", e.target.value)} style={{ ...inputStyle, height: "100px" }} />
                </div>
              </div>

              <div style={cardStyle}>
                <h2>Report settimanale</h2>
                <div style={{ display: "grid", gap: "12px" }}>
                  <input placeholder="Settimana" value={data.reportSettimanale.settimana} onChange={(e) => updateSection("reportSettimanale", "settimana", e.target.value)} style={inputStyle} />
                  <input placeholder="Coperti totali" value={data.reportSettimanale.coperti} onChange={(e) => updateSection("reportSettimanale", "coperti", e.target.value)} style={inputStyle} />
                  <input placeholder="Incasso totale €" value={data.reportSettimanale.incasso} onChange={(e) => updateSection("reportSettimanale", "incasso", e.target.value)} style={inputStyle} />
                  <input placeholder="Food cost %" value={data.reportSettimanale.foodCost} onChange={(e) => updateSection("reportSettimanale", "foodCost", e.target.value)} style={inputStyle} />
                  <input placeholder="Beverage cost %" value={data.reportSettimanale.beverageCost} onChange={(e) => updateSection("reportSettimanale", "beverageCost", e.target.value)} style={inputStyle} />
                  <textarea placeholder="Note della settimana" value={data.reportSettimanale.note} onChange={(e) => updateSection("reportSettimanale", "note", e.target.value)} style={{ ...inputStyle, height: "120px" }} />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
